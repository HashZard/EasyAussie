#!/bin/bash

PROJECT_ROOT="/Users/zard/VScodeProject/EasyAussie"
BACKEND_PATH="$PROJECT_ROOT/backend"
FRONTEND_PATH="$PROJECT_ROOT/frontend"
VENV_PATH="$PROJECT_ROOT/venv"
NGINX_CONFIG_PATH="$PROJECT_ROOT/deploy/local_deploy/nginx.conf"

# 检查命令行参数
RESET_DB=false
if [ "$1" = "--reset-db" ]; then
    RESET_DB=true
    echo "🔄 将重置数据库（--reset-db 参数）"
fi

# === Shutdown previous Flask and Nginx processes ===
function shutdown_services() {
    echo "🧹 Stopping any existing services..."

    # Kill Flask (port 8000)
    FLASK_PIDS=$(lsof -ti tcp:8000)
    if [ -n "$FLASK_PIDS" ]; then
        echo "❌ Killing Flask process(es) on port 8000: $FLASK_PIDS"
        for pid in $FLASK_PIDS; do
            kill -9 "$pid"
        done
    else
        echo "✅ No Flask process found on port 8000"
    fi

    # Kill Frontend Vite dev server (port 3001)
    VITE_PIDS=$(lsof -ti tcp:3001)
    if [ -n "$VITE_PIDS" ]; then
        echo "❌ Killing Vite dev server on port 3001: $VITE_PIDS"
        for pid in $VITE_PIDS; do
            kill -9 "$pid"
        done
    else
        echo "✅ No Vite dev server found on port 3001"
    fi

    # Kill Nginx (port 3000)
    NGINX_PIDS=$(lsof -ti tcp:3000)
    if [ -n "$NGINX_PIDS" ]; then
        echo "❌ Killing processes on port 3000: $NGINX_PIDS"
        for pid in $NGINX_PIDS; do
            kill -9 "$pid"
        done
    else
        echo "✅ No process using port 3000"
    fi

    # Kill nginx master in this project path
    NGINX_MASTERS=$(ps aux | grep 'nginx: master' | grep "$PROJECT_ROOT" | awk '{print $2}')
    if [ -n "$NGINX_MASTERS" ]; then
        echo "❌ Killing project-specific nginx master(s): $NGINX_MASTERS"
        echo "$NGINX_MASTERS" | xargs sudo kill -9
    else
        echo "✅ No nginx master process found in this project"
    fi

    # Fallback: kill all nginx
    echo "🔪 Killing all nginx-related processes..."
    ps aux | grep '[n]ginx' | awk '{print $2}' | xargs sudo kill -9 2>/dev/null

    sleep 1
}

# ===== 创建虚拟环境（如不存在） =====
function setup_venv() {
    if [ ! -d "$VENV_PATH" ]; then
        echo "🐍 正在创建虚拟环境..."
        python3 -m venv "$VENV_PATH"
    else
        echo "✅ 虚拟环境已存在"
    fi
    source "$VENV_PATH/bin/activate"
    if [ -f "$PROJECT_ROOT/requirements.txt" ]; then
        echo "📦 安装依赖..."
        pip install -r "$PROJECT_ROOT/requirements.txt"
    fi
}

# ===== 设置前端环境 =====
function setup_frontend() {
    echo "🎨 设置前端环境..."
    cd "$FRONTEND_PATH" || exit
    
    # 检查是否已安装依赖
    if [ ! -d "node_modules" ]; then
        echo "📦 安装前端依赖..."
        npm install
    else
        echo "✅ 前端依赖已存在"
    fi
}

# ===== 启动前端开发服务 =====
function start_frontend() {
    echo "🚀 启动前端开发服务（端口 3001）..."
    cd "$FRONTEND_PATH" || exit
    npm run dev &
    FRONTEND_PID=$!
    echo "前端进程 PID: $FRONTEND_PID"
    sleep 3
}

# ===== 启动 Flask 开发服务 =====
function start_flask() {
    echo "🚀 启动 Flask 开发服务（端口 8000）..."
    cd "$PROJECT_ROOT" || exit
    
    # 激活虚拟环境
    source "$VENV_PATH/bin/activate"
    
    # 设置环境变量
    export FLASK_APP=backend.app:create_app
    export FLASK_ENV=development
    export PYTHONPATH="$PROJECT_ROOT"
    
    # 后台启动Flask
    flask run --host=0.0.0.0 --port=8000 &
    FLASK_PID=$!
    echo "Flask 进程 PID: $FLASK_PID"
    sleep 3
}

# ===== 启动 Nginx =====
function start_nginx() {
    echo "🌐 启动本地 Nginx（端口 3000）..."
    sudo nginx -c "$NGINX_CONFIG_PATH"
    sleep 2
}

# ===== 检查服务状态 =====
function check_services() {
    echo "🧪 检查服务状态..."
    
    # 等待服务启动
    sleep 5
    
    # 检查后端服务
    echo "检查 Flask 后端服务..."
    if curl -s --max-time 5 http://localhost:8000/ >/dev/null 2>&1; then
        echo "✅ Flask 后端正常运行 (http://localhost:8000)"
    else
        echo "❌ Flask 后端未响应，检查启动日志"
    fi
    
    # 检查前端服务
    echo "检查前端开发服务..."
    if curl -s --max-time 5 http://localhost:3001/ >/dev/null 2>&1; then
        echo "✅ 前端开发服务正常运行 (http://localhost:3001)"
    else
        echo "❌ 前端开发服务未响应，检查启动日志"
    fi
    
    # 检查Nginx（如果启用）
    if curl -s --max-time 5 http://localhost:3000/ >/dev/null 2>&1; then
        echo "✅ Nginx 正常运行 (http://localhost:3000)"
    else
        echo "ℹ️  Nginx 未启用或未响应"
    fi
}


# 数据迁移
function run_migrations() {
    echo ">>> 正在初始化数据库迁移系统..."
    cd "$PROJECT_ROOT" || exit

    # 激活虚拟环境
    source "$VENV_PATH/bin/activate"
    
    export FLASK_APP=backend.app:create_app
    export FLASK_ENV=development
    export PYTHONPATH="$PROJECT_ROOT"

    # 检查是否需要重置或首次运行
    if [ "$RESET_DB" = true ] || [ ! -d "$PROJECT_ROOT/migrations" ]; then
        if [ "$RESET_DB" = true ]; then
            echo "🔄 强制重置数据库..."
        else
            echo "🆕 首次运行，初始化数据库..."
        fi
        
        echo "🗑️  清理旧的迁移和数据库文件..."
        rm -rf "$PROJECT_ROOT/migrations"
        find "$PROJECT_ROOT" -name "*.db" -delete 2>/dev/null || true

        echo "📦 初始化新的 Alembic 目录..."
        flask db init || { echo '❌ flask db init 失败'; exit 1; }

        echo "🔄 生成第一个迁移脚本..."
        flask db migrate -m "Initial migration" || { echo '❌ flask db migrate 失败'; exit 1; }

        echo "⏫ 执行数据库升级..."
        flask db upgrade || { echo '❌ flask db upgrade 失败'; exit 1; }
    else
        echo "📋 检测到已存在的迁移文件，跳过数据库重置"
        echo "💡 如需重置数据库，请先删除 migrations 文件夹"
        
        # 尝试应用任何新的迁移
        echo "🔄 检查并应用新的迁移..."
        flask db upgrade || { echo '⚠️  迁移升级失败，可能需要手动检查'; }
    fi

    echo "✅ 数据库迁移完成"
}

# ===== 自动打开浏览器页面 =====
function open_browser() {
    echo "🌍 打开浏览器..."
    echo "   前端开发服务: http://localhost:3001"
    echo "   后端API服务: http://localhost:8000"
    echo "   Nginx服务: http://localhost:3000"
    
    # 优先打开前端开发服务（热重载）
    open "http://localhost:3001"
}

# ===== 执行流程 =====
echo "🔧 开始本地开发环境配置"
shutdown_services
setup_venv
setup_frontend

# 先运行数据库迁移
run_migrations

# 启动服务（先后端再前端）
start_flask
start_frontend
start_nginx  # 启动nginx代理服务

# 检查服务状态
check_services
open_browser

echo "🎉 本地服务已全部启动！"
echo ""
echo "📋 服务地址："
echo "   🎨 前端开发服务: http://localhost:3001 (推荐，支持热重载)"
echo "   🐍 后端API服务:  http://localhost:8000"
echo "   🌐 Nginx服务:    http://localhost:3000 (可选)"
echo ""
echo "💡 提示："
echo "   - 前端文件修改会自动刷新"
echo "   - 后端修改需要手动重启"
echo "   - 按 Ctrl+C 停止所有服务"
echo "   - 数据库数据会被保留，除非使用 --reset-db 参数"
echo ""
echo "🔍 查看服务状态："
echo "   ps aux | grep -E '(flask|node.*vite)'"
echo ""
echo "🗃️  数据库管理："
echo "   重置数据库: bash setup.sh --reset-db"
