#!/bin/bash

PROJECT_ROOT="/Users/zard/PycharmProjects/EasyAussie"
BACKEND_PATH="$PROJECT_ROOT/backend"
FRONTEND_PATH="$PROJECT_ROOT/frontend"
VENV_PATH="$PROJECT_ROOT/venv"
NGINX_CONFIG_PATH="$PROJECT_ROOT/deploy/local_deploy/nginx.conf"

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

# ===== 启动 Flask 开发服务 =====
function start_flask() {
    echo "🚀 启动 Flask 开发服务（端口 8000）..."
    cd "$PROJECT_ROOT" || exit               # ← 切换到项目根目录
    export FLASK_APP=backend.app:create_app
    export FLASK_ENV=development
    export PYTHONPATH="$PROJECT_ROOT"       # ← 保证 Python 能找到 backend 包
    flask run --port=8000 &
    sleep 2
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
    curl -s http://localhost:8000/api/form-submit >/dev/null && echo "✅ Flask 正常运行" || echo "❌ Flask 未响应"
    curl -s http://localhost:3000/index.html >/dev/null && echo "✅ Nginx 正常运行" || echo "❌ Nginx 未响应"
}


# 数据迁移
function run_migrations() {
    echo ">>> 正在初始化数据库迁移系统..."
    cd $PROJECT_ROOT || exit

    export FLASK_APP=backend.app:create_app
    export FLASK_ENV=production # development/production/testing

    if [ ! -d "$PROJECT_ROOT/migrations" ]; then
        echo "📦 初始化 Alembic 目录..."
        flask db init || { echo '❌ flask db init 失败'; exit 1; }
    else
        echo "📦 Alembic 已存在，跳过 init"
    fi

    echo "🔄 生成迁移脚本..."
    flask db migrate -m "Auto migration" || { echo '❌ flask db migrate 失败'; exit 1; }

    echo "⏫ 执行数据库升级..."
    flask db upgrade || { echo '❌ flask db upgrade 失败'; exit 1; }

    echo "✅ 数据库迁移完成"
}

# ===== 自动打开浏览器页面 =====
function open_browser() {
    echo "🌍 打开浏览器: http://localhost:3000/index.html"
    open "http://localhost:3000/index.html"
}

# ===== 执行流程 =====
echo "🔧 开始本地开发环境配置"
shutdown_services
setup_venv
start_flask
start_nginx
check_services
run_migrations
open_browser
echo "🎉 本地服务已全部启动！"
