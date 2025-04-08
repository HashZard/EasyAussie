#!/bin/bash

PROJECT_PATH="/var/www/EasyAussie"
VENV_PATH="$PROJECT_PATH/venv"
SERVICE_NAME="easyaussie"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
NGINX_CONF_PATH="/etc/nginx/sites-available/easyaussie"
REQUIREMENTS_FILE="$PROJECT_PATH/requirements.txt"
REQUIREMENTS_HASH_FILE="$PROJECT_PATH/.requirements.md5"
LOG_DIR="/var/log/easyaussie"   # 定义日志路径


# 停止 `gunicorn`，确保不会重复启动
function stop_old_processes() {
    echo ">>> 停止旧的 Flask 进程..."
    sudo systemctl stop $SERVICE_NAME
    sudo pkill -f gunicorn  # 确保所有 Gunicorn 进程被杀死
    sleep 2  # 等待进程完全退出
}

# 安装依赖（仅在 requirements.txt 更新时执行）
function install_dependencies() {
    if [ ! -f "$REQUIREMENTS_HASH_FILE" ] || ! md5sum -c "$REQUIREMENTS_HASH_FILE" &>/dev/null; then
        echo ">>> 安装或更新 Python 依赖..."
        source $VENV_PATH/bin/activate || { echo "❌ 激活虚拟环境失败"; exit 1; }
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

# 重新启动服务
function restart_services() {
    echo ">>> 运行数据库迁移..."
    source $VENV_PATH/bin/activate  # 激活虚拟环境

    export FLASK_APP=backend.app.app  # 确保 Flask 入口正确
    export FLASK_ENV=development

    # 检查是否存在 `migrations/` 目录，如果没有则初始化
    if [ ! -d "$PROJECT_PATH/migrations" ]; then
        echo ">>> 初始化数据库迁移..."
        flask db init || { echo "❌ 数据库迁移初始化失败"; exit 1; }
    fi

    # 确保数据库文件存在
    if [ ! -f "$PROJECT_PATH/backend/app.db" ]; then
        echo ">>> 创建数据库..."
        flask db upgrade || { echo "❌ 数据库初始化失败"; exit 1; }
    fi

    # 运行迁移
    echo ">>> 执行数据库迁移..."
    flask db migrate -m "Auto migration" || { echo "❌ 生成迁移失败"; exit 1; }
    flask db upgrade || { echo "❌ 数据库迁移失败"; exit 1; }

    echo "✅ 数据库迁移完成！"

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

    echo "==================== 🔧 准备运行环境（权限 & 目录） ===================="

    ## 日志目录
    echo "📁 检查日志目录: $LOG_DIR"
    if [ ! -d "$LOG_DIR" ]; then
        echo "➕ 创建日志目录..."
        sudo mkdir -p "$LOG_DIR"
    fi
    echo "🔐 设置日志目录权限给 $SERVICE_USER"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$LOG_DIR"

    ## 上传目录
    echo "📁 检查上传目录: $UPLOAD_DIR"
    if [ ! -d "$UPLOAD_DIR" ]; then
        echo "➕ 创建上传目录..."
        sudo mkdir -p "$UPLOAD_DIR"
    fi
    echo "🔐 设置上传目录权限给 $SERVICE_USER"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$UPLOAD_DIR"

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

    echo "✅ 运行环境准备完成！"
}



# 执行完整部署或更新
if [ $# -eq 0 ]; then
    echo ">>> 默认执行更新操作..."
    stop_old_processes
    update_code
    install_dependencies
    restart_services
else
    case $1 in
        --full-setup)
            stop_old_processes
            update_code
            install_dependencies
            update_systemd_config
            prepare_runtime_environment
            restart_services
            ;;
        --restart)
            stop_old_processes
            update_code
            restart_services
            ;;
        --help)
            usage
            ;;
        *)
            echo "无效参数：$1"
            usage
            exit 1
            ;;
    esac
fi

echo "✅ === 部署完成 === ✅"
