#!/bin/bash
# =============================================================================
# EasyAussie 简化启动脚本
# 一键启动开发环境，自动处理数据库迁移和管理员初始化
# =============================================================================

PROJECT_ROOT="/Users/zard/VScodeProject/EasyAussie"
BACKEND_PATH="$PROJECT_ROOT/backend"
FRONTEND_PATH="$PROJECT_ROOT/frontend"
VENV_PATH="$PROJECT_ROOT/venv"
NGINX_CONFIG_PATH="$PROJECT_ROOT/deploy/local_deploy/nginx.conf"

# 显示脚本信息
echo "🚀 EasyAussie 开发环境启动"
echo "================================="

# ===== 停止现有服务 =====
function shutdown_services() {
    echo "🧹 停止现有服务..."

    # 停止 Flask (端口 8000)
    FLASK_PIDS=$(lsof -ti tcp:8000 2>/dev/null)
    if [ -n "$FLASK_PIDS" ]; then
        echo "   ❌ 停止 Flask 服务 (PID: $FLASK_PIDS)"
        kill -9 $FLASK_PIDS 2>/dev/null
    fi

    # 停止前端开发服务器 (端口 3001)
    VITE_PIDS=$(lsof -ti tcp:3001 2>/dev/null)
    if [ -n "$VITE_PIDS" ]; then
        echo "   ❌ 停止前端开发服务器 (PID: $VITE_PIDS)"
        kill -9 $VITE_PIDS 2>/dev/null
    fi

    # 停止 Nginx (端口 3000) - 仅尝试普通用户权限
    NGINX_PIDS=$(lsof -ti tcp:3000 2>/dev/null)
    if [ -n "$NGINX_PIDS" ]; then
        echo "   ❌ 停止 Nginx 服务 (PID: $NGINX_PIDS)"
        kill -9 $NGINX_PIDS 2>/dev/null
    fi

    sleep 1
    echo "✅ 服务清理完成"
}

# ===== 设置 Python 虚拟环境 =====
function setup_venv() {
    echo "🐍 设置 Python 虚拟环境..."
    
    if [ ! -d "$VENV_PATH" ]; then
        echo "   📦 创建虚拟环境..."
        python3 -m venv "$VENV_PATH"
    fi
    
    source "$VENV_PATH/bin/activate"
    
    if [ -f "$PROJECT_ROOT/requirements.txt" ]; then
        echo "   📚 安装 Python 依赖..."
        pip install -r "$PROJECT_ROOT/requirements.txt" --quiet
    fi
    
    echo "✅ Python 环境准备完成"
}

# ===== 设置前端环境 =====
function setup_frontend() {
    echo "🎨 设置前端环境..."
    cd "$FRONTEND_PATH" || exit
    
    if [ ! -d "node_modules" ]; then
        echo "   📦 安装前端依赖..."
        npm install --silent
    fi
    
    echo "✅ 前端环境准备完成"
}

# ===== 数据库初始化和迁移 =====
function setup_database() {
    echo "🗄️  初始化数据库..."
    cd "$PROJECT_ROOT" || exit
    
    # 激活虚拟环境
    source "$VENV_PATH/bin/activate"
    
    export FLASK_APP=backend.app:create_app
    export FLASK_ENV=development
    export PYTHONPATH="$PROJECT_ROOT"

    # 检查是否需要初始化数据库
    if [ ! -d "$PROJECT_ROOT/migrations" ]; then
        echo "   🆕 首次运行，初始化数据库迁移..."
        
        # 初始化 Alembic
        flask db init --quiet || { echo "❌ flask db init 失败"; exit 1; }
        
        # 生成第一个迁移文件
        flask db migrate -m "Initial migration" --quiet || { echo "❌ flask db migrate 失败"; exit 1; }
        
        # 应用迁移
        flask db upgrade --quiet || { echo "❌ flask db upgrade 失败"; exit 1; }
        
        echo "   ✅ 数据库初始化完成"
    else
        echo "   🔄 检查数据库迁移状态..."
        
        # 检查是否有待应用的迁移
        if ! flask db current >/dev/null 2>&1; then
            echo "   ⏫ 应用数据库迁移..."
            flask db upgrade --quiet || {
                echo "   🔄 生成新的迁移文件..."
                flask db migrate -m "Auto migration" --quiet || { echo "❌ 迁移失败"; exit 1; }
                flask db upgrade --quiet || { echo "❌ 应用迁移失败"; exit 1; }
            }
        fi
        
        echo "   ✅ 数据库迁移完成"
    fi
}

# ===== 初始化管理员账户 =====
function init_admin() {
    echo "👤 初始化管理员账户..."
    cd "$PROJECT_ROOT" || exit
    
    # 激活虚拟环境
    source "$VENV_PATH/bin/activate"
    
    export FLASK_APP=backend.app:create_app
    export FLASK_ENV=development
    export PYTHONPATH="$PROJECT_ROOT"
    
    # 直接运行管理员初始化脚本（脚本内部会处理所有检查逻辑）
    python "$PROJECT_ROOT/backend/scripts/init_admin.py" || {
        echo "❌ 管理员初始化失败"
        exit 1
    }
}

# ===== 启动后端服务 =====
function start_backend() {
    echo "🚀 启动后端服务..."
    cd "$PROJECT_ROOT" || exit
    
    # 激活虚拟环境
    source "$VENV_PATH/bin/activate"
    
    # 设置环境变量
    export FLASK_APP=backend.app:create_app
    export FLASK_ENV=development
    export PYTHONPATH="$PROJECT_ROOT"
    
    # 创建日志目录
    LOG_DIR="$PROJECT_ROOT/logs"
    mkdir -p "$LOG_DIR"
    
    # 后台启动Flask，输出日志到文件
    nohup flask run --host=0.0.0.0 --port=8000 > "$LOG_DIR/backend.log" 2>&1 &
    FLASK_PID=$!
    echo "   ✅ Flask 服务已启动 (PID: $FLASK_PID, Port: 8000)"
    echo "   📋 后端日志文件: $LOG_DIR/backend.log"
    
    # 等待服务启动
    sleep 3
}

# ===== 启动前端服务 =====
function start_frontend() {
    echo "🎨 启动前端服务..."
    cd "$FRONTEND_PATH" || exit
    
    # 创建日志目录
    LOG_DIR="$PROJECT_ROOT/logs"
    mkdir -p "$LOG_DIR"
    
    # 后台启动前端开发服务器，输出日志到文件
    nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo "   ✅ 前端开发服务器已启动 (PID: $FRONTEND_PID, Port: 3001)"
    echo "   📋 前端日志文件: $LOG_DIR/frontend.log"
    
    # 等待服务启动
    sleep 3
}

# ===== 启动 Nginx 代理 (可选) =====
function start_nginx() {
    echo "🌐 尝试启动 Nginx 代理..."
    
    if [ -f "$NGINX_CONFIG_PATH" ]; then
        # 尝试以当前用户权限启动nginx
        nginx -c "$NGINX_CONFIG_PATH" 2>/dev/null && {
            echo "   ✅ Nginx 代理已启动 (Port: 3000)"
        } || {
            # 如果失败，尝试sudo（静默失败）
            sudo nginx -c "$NGINX_CONFIG_PATH" 2>/dev/null && {
                echo "   ✅ Nginx 代理已启动 (Port: 3000)"
            } || {
                echo "   ⚠️  Nginx 启动失败，跳过代理服务"
                echo "      提示：可直接使用前端服务 http://localhost:3001"
            }
        }
    else
        echo "   ⚠️  Nginx 配置文件不存在，跳过代理服务"
    fi
}

# ===== 检查服务状态 =====
function check_services() {
    echo "🔍 检查服务状态..."
    
    # 等待服务完全启动
    sleep 2
    
    # 检查后端服务
    if curl -s --max-time 5 http://localhost:8000/api/profile >/dev/null 2>&1; then
        echo "   ✅ 后端服务正常运行"
    else
        echo "   ⚠️  后端服务可能未完全启动"
    fi
    
    # 检查前端服务
    if curl -s --max-time 5 http://localhost:3001/ >/dev/null 2>&1; then
        echo "   ✅ 前端服务正常运行"
    else
        echo "   ⚠️  前端服务可能未完全启动"
    fi
    
    # 检查Nginx
    if curl -s --max-time 5 http://localhost:3000/ >/dev/null 2>&1; then
        echo "   ✅ Nginx 代理正常运行"
    fi
}

# ===== 显示完成信息 =====
function show_completion() {
    echo ""
    echo "🎉 开发环境启动完成！"
    echo "================================="
    echo ""
    echo "📋 服务地址："
    echo "   🎨 前端开发服务: http://localhost:3001 (推荐，支持热重载)"
    echo "   🐍 后端API服务:  http://localhost:8000"
    echo "   🌐 Nginx代理:    http://localhost:3000 (如果可用)"
    echo ""
    echo "👤 默认管理员账户："
    echo "   📧 邮箱: admin@easyaussie.com"
    echo "   🔑 密码: admin2025"
    echo ""
    echo "📋 查看日志："
    echo "   🐍 后端日志: tail -f $PROJECT_ROOT/logs/backend.log"
    echo "   🎨 前端日志: tail -f $PROJECT_ROOT/logs/frontend.log"
    echo "   📊 实时监控: tail -f $PROJECT_ROOT/logs/*.log"
    echo ""
    echo "💡 使用提示："
    echo "   - 前端文件修改会自动热重载"
    echo "   - 后端修改需要重新运行此脚本"
    echo "   - 按 Ctrl+C 可以在任何时候停止服务"
    echo ""
    echo "🔍 查看运行状态："
    echo "   ps aux | grep -E '(flask|node.*vite)'"
    echo ""
    
    # 自动打开浏览器
    if command -v open >/dev/null 2>&1; then
        echo "🌍 正在打开浏览器..."
        open "http://localhost:3001"
    fi
}

# ===== 主执行流程 =====
function main() {
    # 检查是否在正确的目录
    if [ ! -f "$FRONTEND_PATH/package.json" ] || [ ! -f "$PROJECT_ROOT/requirements.txt" ]; then
        echo "❌ 错误：项目文件不完整"
        echo "   检查前端目录：$FRONTEND_PATH"
        echo "   检查根目录：$PROJECT_ROOT"
        exit 1
    fi
    
    # 执行启动流程
    shutdown_services
    setup_venv
    setup_frontend
    setup_database
    init_admin
    start_backend
    start_frontend
    start_nginx
    check_services
    show_completion
    
    # 保持脚本运行，监听中断信号
    echo "📌 服务正在运行中... (按 Ctrl+C 停止所有服务)"
    echo "💡 提示: 按 'l' + Enter 查看实时日志，按 'q' + Enter 退出日志监控"
    
    # 设置信号处理
    trap 'echo ""; echo "🛑 正在停止服务..."; shutdown_services; echo "✅ 所有服务已停止"; exit 0' INT
    
    # 等待用户输入或中断
    while true; do
        read -t 1 -r input 2>/dev/null
        case "$input" in
            "l"|"L")
                echo "📋 开始监控日志 (按 Ctrl+C 退出日志监控)..."
                echo "================================="
                tail -f "$PROJECT_ROOT/logs/backend.log" "$PROJECT_ROOT/logs/frontend.log" 2>/dev/null || echo "⚠️ 日志文件不存在"
                echo "📌 回到主监控模式..."
                ;;
            "q"|"Q")
                echo "🛑 正在停止服务..."
                shutdown_services
                echo "✅ 所有服务已停止"
                exit 0
                ;;
        esac
    done
}

# 运行主函数
main
