#!/bin/bash

PROJECT_PATH="/var/www/EasyAussie"
VENV_PATH="$PROJECT_PATH/venv"
SERVICE_NAME="easyaussie"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
NGINX_CONF_PATH="/etc/nginx/sites-available/easyaussie"
REQUIREMENTS_FILE="$PROJECT_PATH/requirements.txt"
REQUIREMENTS_HASH_FILE="$PROJECT_PATH/.requirements.md5"
LOG_DIR="/var/log/easyaussie"   # 定义日志路径

# 显示使用说明
function usage() {
    echo "=== EasyAussie 部署脚本使用说明 ==="
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  无参数        - 执行快速更新（停止服务->拉取代码->安装依赖->重启服务）"
    echo "  --full-setup  - 执行完整部署（包含配置更新、环境准备、数据库迁移、管理员初始化）"
    echo "  --restart     - 重启式更新（停止服务->拉取代码->数据库迁移->重启服务）"
    echo "  --help        - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0              # 快速更新"
    echo "  $0 --full-setup # 完整部署"
    echo "  $0 --restart    # 重启式更新"
    echo ""
}

# 停止 `gunicorn`，确保不会重复启动
function stop_old_processes() {
    echo ">>> 停止旧的 Flask 进程..."
    sudo systemctl stop $SERVICE_NAME
    sudo pkill -f gunicorn  # 确保所有 Gunicorn 进程被杀死
    sleep 2  # 等待进程完全退出
}

# 安装依赖（仅在 requirements.txt 更新时执行）
function install_dependencies() {
    source $VENV_PATH/bin/activate || { echo "❌ 激活虚拟环境失败"; exit 1; }

    if [ ! -f "$REQUIREMENTS_HASH_FILE" ] || ! md5sum -c "$REQUIREMENTS_HASH_FILE" &>/dev/null; then
        echo ">>> 安装或更新 Python 依赖..."
        pip install -r $REQUIREMENTS_FILE || { echo "❌ 依赖安装失败"; exit 1; }
        md5sum $REQUIREMENTS_FILE > $REQUIREMENTS_HASH_FILE  # 更新校验值
    else
        echo ">>> 依赖已是最新，无需重新安装。"
    fi
}

# 更新代码
function update_code() {
    echo ">>> 拉取最新代码..."
    cd $PROJECT_PATH || { echo "❌ 进入目录失败"; exit 1; }
    git pull origin master || { echo "❌ 代码更新失败"; exit 1; }
}

# 数据库备份
function backup_database() {
    echo ">>> 创建数据库备份..."
    
    local DB_FILE="$PROJECT_PATH/backend/app.db"
    local BACKUP_DIR="$PROJECT_PATH/backups"
    local TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
    local BACKUP_FILE="$BACKUP_DIR/app_db_backup_$TIMESTAMP.db"
    
    # 创建备份目录
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "📁 创建备份目录..."
        mkdir -p "$BACKUP_DIR"
    fi
    
    # 备份数据库
    if [ -f "$DB_FILE" ]; then
        echo "💾 备份数据库到: $BACKUP_FILE"
        cp "$DB_FILE" "$BACKUP_FILE" || {
            echo "⚠️ 数据库备份失败，但继续执行..."
        }
        
        # 保留最近10个备份
        echo "🧹 清理旧备份文件..."
        find "$BACKUP_DIR" -name "app_db_backup_*.db" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true
        
        echo "✅ 数据库备份完成"
    else
        echo "⚠️ 数据库文件不存在，跳过备份"
    fi
}

# 数据迁移（智能版本）
function run_migrations() {
    echo ">>> 正在执行智能数据库迁移..."
    cd $PROJECT_PATH || exit
    source $VENV_PATH/bin/activate || { echo "❌ 激活虚拟环境失败"; exit 1; }

    export FLASK_APP=backend.app:create_app
    export FLASK_ENV=production

    # 检查数据库连接
    echo "🔗 检查数据库连接..."
    if ! python3 -c "
import sys
sys.path.insert(0, '$PROJECT_PATH')
try:
    from backend.app import create_app
    app = create_app()
    with app.app_context():
        from backend.app.models import db
        db.engine.execute('SELECT 1')
    print('✅ 数据库连接正常')
except Exception as e:
    print(f'❌ 数据库连接失败: {e}')
    sys.exit(1)
"; then
        echo "数据库连接验证成功"
    else
        echo "❌ 数据库连接失败，终止迁移"
        exit 1
    fi

    # 检查migrations目录是否存在
    if [ ! -d "$PROJECT_PATH/migrations" ]; then
        echo "📦 初始化 Alembic 目录..."
        flask db init || { echo '❌ flask db init 失败'; exit 1; }
        
        echo "🔄 生成初始迁移脚本..."
        flask db migrate -m "Initial migration" || { echo '❌ 生成初始迁移失败'; exit 1; }
    else
        echo "📂 迁移目录已存在，检测模型变更..."
        
        # 检查当前数据库版本
        CURRENT_VERSION=$(flask db current 2>/dev/null || echo "无版本信息")
        echo "📊 当前数据库版本: $CURRENT_VERSION"
        
        # 尝试生成新的迁移（检测模型变更）
        echo "🔍 检测模型变更..."
        TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
        MIGRATE_OUTPUT=$(flask db migrate -m "Auto migration $TIMESTAMP" 2>&1)
        MIGRATE_EXIT_CODE=$?
        
        echo "$MIGRATE_OUTPUT"
        
        # 分析迁移输出
        if echo "$MIGRATE_OUTPUT" | grep -q "No changes"; then
            echo "✅ 模型无变化，无需生成新迁移"
        elif [ $MIGRATE_EXIT_CODE -eq 0 ]; then
            echo "🔄 检测到模型变更，已生成新的迁移文件"
            
            # 在应用迁移前备份数据库
            echo "🛡️ 应用迁移前备份数据库..."
            backup_database
        else
            echo "⚠️ 迁移生成可能有问题，但继续执行升级..."
        fi
    fi

    echo "⏫ 执行数据库升级..."
    flask db upgrade || { 
        echo "❌ 数据库升级失败"
        
        # 尝试修复常见问题
        echo "🔧 尝试修复数据库问题..."
        flask db stamp head 2>/dev/null && {
            echo "📌 重新标记数据库版本"
            flask db upgrade || {
                echo "❌ 修复失败，请手动检查"
                exit 1
            }
        } || {
            echo "❌ 无法修复，请手动检查"
            exit 1
        }
    }

    # 验证升级结果
    echo "✅ 验证迁移结果..."
    NEW_VERSION=$(flask db current 2>/dev/null || echo "获取版本失败")
    echo "📊 升级后版本: $NEW_VERSION"

    echo "✅ 数据库迁移完成"
}


# 前端构建（TypeScript 编译）
function build_frontend() {
    echo ">>> 开始前端构建..."
    
    if [ -f "$PROJECT_PATH/frontend/package.json" ]; then
        echo "📦 发现前端项目，开始构建..."
        cd $PROJECT_PATH/frontend || { echo "❌ 进入前端目录失败"; exit 1; }
        
        # 检查 Node.js 是否安装
        if command -v npm &> /dev/null; then
            echo "⬇️ 安装前端依赖..."
            npm install || { echo "❌ 前端依赖安装失败"; exit 1; }
            
            echo "🔨 构建前端资源（TypeScript -> JavaScript）..."
            npm run build || { echo "❌ 前端构建失败"; exit 1; }
            
            # 确保构建输出目录权限正确
            echo "🔐 设置构建文件权限..."
            sudo chown -R www-data:www-data "$PROJECT_PATH/frontend/dist/"
            sudo chmod -R 755 "$PROJECT_PATH/frontend/dist/"
            
            echo "✅ 前端构建完成，TypeScript 已编译为 JavaScript"
        else
            echo "⚠️ Node.js 未安装，跳过前端构建"
            echo "❌ 注意：没有构建的话 TypeScript 文件将无法在浏览器中运行"
            exit 1
        fi
    else
        echo "📄 未发现前端项目，跳过构建步骤"
    fi
}

# 重新启动服务
function restart_services() {
    echo ">>> 重新启动 Flask (Gunicorn)..."
    sudo systemctl daemon-reload
    sudo systemctl start $SERVICE_NAME
    sudo systemctl enable $SERVICE_NAME

    echo ">>> 重新启动 Nginx..."
    sudo systemctl restart nginx
}

# 更新系统配置文件
# systemd 服务文件、Nginx 配置文件
function update_systemd_config() {
    echo ">>> 更新 systemd 服务文件..."
    if [ -f "$PROJECT_PATH/deploy/easyaussie.service" ]; then
        sudo cp "$PROJECT_PATH/deploy/easyaussie.service" "$SERVICE_FILE"
        sudo systemctl daemon-reload
        echo "✅ systemd 服务文件已更新！"
    else
        echo "❌ 未找到 easyaussie.service 文件，跳过更新。"
    fi

    echo ">>> 更新 Nginx 配置..."
    if [ -f "$PROJECT_PATH/deploy/nginx.conf" ]; then
        sudo cp "$PROJECT_PATH/deploy/nginx.conf" "$NGINX_CONF_PATH"
        sudo ln -sf "$NGINX_CONF_PATH" "/etc/nginx/sites-enabled/easyaussie"
        sudo systemctl restart nginx
        echo "✅ Nginx 配置已更新并重启！"
    else
        echo "❌ 未找到 nginx.conf 文件，跳过更新。"
    fi
}

function prepare_runtime_environment() {
    SERVICE_USER="www-data"

    LOG_DIR="/var/log/easyaussie"
    UPLOAD_DIR="/var/www/EasyAussie/backend/uploads"
    DB_FILE="/var/www/EasyAussie/backend/app.db"
    DB_DIR="/var/www/EasyAussie/backend"
    CONFIG_DIR="/var/www/EasyAussie/backend/config"
    BACKUP_DIR="/var/www/EasyAussie/backups"

    echo "==================== 🔧 准备运行环境（权限 & 目录） ===================="

    ## 日志目录
    echo "📁 检查日志目录: $LOG_DIR"
    if [ ! -d "$LOG_DIR" ]; then
        echo "➕ 创建日志目录..."
        sudo mkdir -p "$LOG_DIR"
    fi
    
    echo "🔐 设置日志目录权限给 $SERVICE_USER"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$LOG_DIR"
    sudo chmod -R 755 "$LOG_DIR"

    ## 备份目录
    echo "📁 检查备份目录: $BACKUP_DIR"
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "➕ 创建备份目录..."
        sudo mkdir -p "$BACKUP_DIR"
    fi
    echo "🔐 设置备份目录权限给 $SERVICE_USER"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$BACKUP_DIR"
    sudo chmod 755 "$BACKUP_DIR"

    ## 上传目录
    echo "📁 检查上传目录: $UPLOAD_DIR"
    if [ ! -d "$UPLOAD_DIR" ]; then
        echo "➕ 创建上传目录..."
        sudo mkdir -p "$UPLOAD_DIR"
    fi
    echo "🔐 设置上传目录权限给 $SERVICE_USER"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$UPLOAD_DIR"
    sudo chmod 755 "$UPLOAD_DIR"
    sudo chmod 755 "$UPLOAD_DIR"

    ## 配置目录权限（保护敏感文件）
    if [ -d "$CONFIG_DIR" ]; then
        echo "📁 设置配置目录权限: $CONFIG_DIR"
        sudo chown -R $SERVICE_USER:$SERVICE_USER "$CONFIG_DIR"
        sudo chmod 750 "$CONFIG_DIR"
        # 保护JSON配置文件
        sudo find "$CONFIG_DIR" -name "*.json" -exec chmod 640 {} \;
    fi

    ## 数据库文件权限
    echo "📄 检查数据库文件权限: $DB_FILE"
    if [ -f "$DB_FILE" ]; then
        sudo chown $SERVICE_USER:$SERVICE_USER "$DB_FILE"
        sudo chmod 664 "$DB_FILE"
    else
        echo "⚠️ 尚未生成数据库文件，跳过权限设置"
    fi

    ## 数据库目录权限
    echo "📁 设置数据库目录权限: $DB_DIR"
    sudo chown $SERVICE_USER:$SERVICE_USER "$DB_DIR"
    sudo chmod 755 "$DB_DIR"

    ## 项目根目录权限
    echo "📁 设置项目根目录权限: $PROJECT_PATH"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$PROJECT_PATH"
    
    ## 确保可执行文件有正确权限
    if [ -f "$PROJECT_PATH/backend/app.py" ]; then
        sudo chmod 644 "$PROJECT_PATH/backend/app.py"
    fi

    echo "✅ 运行环境准备完成！"
}

# 执行完整部署或更新

# 初始化管理员用户
}

# 配置Flask应用日志
function setup_flask_logging() {
    echo ">>> 配置Flask应用日志..."
    
    # 确保日志目录存在
    local LOG_APP_DIR="/var/log/easyaussie/app"
    if [ ! -d "$LOG_APP_DIR" ]; then
        echo "📁 创建应用日志目录..."
        sudo mkdir -p "$LOG_APP_DIR"
        sudo chown -R www-data:www-data "$LOG_APP_DIR"
        sudo chmod -R 755 "$LOG_APP_DIR"
    fi
    
    # 更新Flask应用以使用增强的日志配置（按天轮转）
    echo "🔧 升级Flask应用日志配置为按天轮转..."
    python3 "$PROJECT_PATH/deploy/update_flask_app.py" || {
        echo "⚠️ Flask应用日志配置更新失败，使用原有配置..."
    }
    
    echo "✅ Flask日志配置完成"
}

# 执行完整部署或更新
if [ $# -eq 0 ]; then
    echo ">>> 默认执行快速更新操作..."
    stop_old_processes
    update_code
    install_dependencies
    build_frontend
    restart_services
else
    case $1 in
        --full-setup)
            echo ">>> 执行完整部署设置..."
            stop_old_processes
            update_code
            install_dependencies
            update_systemd_config
            prepare_runtime_environment
            build_frontend
            run_migrations
            restart_services
            ;;
        --restart)
            echo ">>> 执行重启式更新..."
            stop_old_processes
            update_code
            install_dependencies
            update_systemd_config
            build_frontend
            run_migrations
            restart_services
            ;;
        --help)
            usage
            ;;
        *)
            echo "❌ 无效参数：$1"
            usage
            exit 1
            ;;
    esac
fi

echo "✅ === 部署完成 === ✅"

# 显示部署后信息
echo ""
echo "🌐 服务信息:"
echo "   应用地址: http://your-domain.com"
echo "   服务状态: sudo systemctl status $SERVICE_NAME"
echo ""
echo "📋 日志信息:"
echo "   应用日志: tail -f /var/log/easyaussie/app.log"
echo "   数据库日志: tail -f /var/log/easyaussie/database.log"
echo "   服务日志: sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "🔧 管理命令:"
echo "   重启服务: sudo systemctl restart $SERVICE_NAME"
echo "   查看状态: sudo systemctl status $SERVICE_NAME"
echo "   查看备份: ls -la $PROJECT_PATH/backups/"
echo ""
echo "💡 提示: 日志配置由应用程序 __init__.py 管理"
