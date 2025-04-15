#!/bin/bash

PROJECT_ROOT="/Users/zard/PycharmProjects/EasyAussie"
BACKEND_PATH="$PROJECT_ROOT/backend"
FRONTEND_PATH="$PROJECT_ROOT/frontend"
VENV_PATH="$PROJECT_ROOT/venv"
NGINX_CONFIG_PATH="$PROJECT_ROOT/deploy/local_deploy/nginx.conf"

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

# ===== 自动打开浏览器页面 =====
function open_browser() {
    echo "🌍 打开浏览器: http://localhost:3000/index.html"
    open "http://localhost:3000/index.html"
}

# ===== 执行流程 =====
echo "🧹 清理旧的 Flask 和 Nginx 进程..."
# 杀掉之前的 Flask（监听 8000）
lsof -ti tcp:8000 | xargs kill -9 2>/dev/null
# 关闭 Nginx（如果已在运行）
sudo nginx -s stop 2>/dev/null

echo "🔧 开始本地开发环境配置"
setup_venv
start_flask
start_nginx
check_services
open_browser
echo "🎉 本地服务已全部启动！"
