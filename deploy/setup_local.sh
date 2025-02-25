#!/bin/bash

PROJECT_PATH="$(pwd)"
VENV_PATH="$PROJECT_PATH/venv"
REQUIREMENTS_FILE="$PROJECT_PATH/requirements.txt"
REQUIREMENTS_HASH_FILE="$PROJECT_PATH/.requirements.md5"
FLASK_APP="backend/app.py"
NGINX_CONF_PATH="/usr/local/etc/nginx/servers/nginx.dev.conf"

# 输出使用说明
function usage() {
    echo "Usage: local_setup.sh [options]"
    echo "Options:"
    echo "  --init           初始化本地环境（创建虚拟环境、安装依赖、配置 Nginx）"
    echo "  --update         更新依赖（仅在 requirements.txt 修改时）"
    echo "  --start          启动 Flask 和 Nginx 服务"
    echo "  --stop           停止本地服务"
    echo "  --help           显示帮助信息"
}

# 创建虚拟环境
function create_virtualenv() {
    if [ ! -d "$VENV_PATH" ]; then
        echo ">>> 创建虚拟环境..."
        python3 -m venv $VENV_PATH || { echo "虚拟环境创建失败"; exit 1; }
    fi
}

# 激活虚拟环境
function activate_virtualenv() {
    echo ">>> 激活虚拟环境..."
    source $VENV_PATH/bin/activate || { echo "激活虚拟环境失败"; exit 1; }
}

# 安装依赖（仅在 requirements.txt 修改时执行）
function install_dependencies() {
    if [ ! -f "$REQUIREMENTS_HASH_FILE" ] || ! md5 -q $REQUIREMENTS_FILE | diff -q - "$REQUIREMENTS_HASH_FILE" &>/dev/null; then
        echo ">>> 安装或更新 Python 依赖..."
        activate_virtualenv
        pip install -r $REQUIREMENTS_FILE || { echo "依赖安装失败"; exit 1; }
        md5 -q $REQUIREMENTS_FILE > $REQUIREMENTS_HASH_FILE  # 更新校验值
    else
        echo ">>> 依赖已是最新，无需重新安装。"
    fi
}

# 配置 Nginx
function configure_nginx() {
    echo ">>> 配置 Nginx 服务..."
    sudo cp deploy/nginx.dev.conf $NGINX_CONF_PATH || { echo "复制 Nginx 配置失败"; exit 1; }
    sudo nginx -t || { echo "Nginx 配置测试失败"; exit 1; }
    sudo nginx -s reload || { echo "Nginx 重启失败"; exit 1; }
}

# 启动 Flask 服务
function start_flask() {
    activate_virtualenv
    echo ">>> 启动 Flask 开发服务器..."
    export FLASK_APP=$PROJECT_PATH/backend/app.py
    export FLASK_ENV=development
    flask run --host=127.0.0.1 --port=5000 || { echo "Flask 启动失败"; exit 1; }
}

# 启动本地服务（Flask + Nginx）
function start_services() {
    configure_nginx
    start_flask
}

# 停止本地服务
function stop_services() {
    echo ">>> 停止 Flask 服务..."
    pkill -f flask || echo "Flask 服务未运行"

    echo ">>> 停止 Nginx 服务..."
    sudo nginx -s stop || echo "Nginx 服务未运行"
}

# 解析命令行参数并执行对应操作
if [ $# -eq 0 ]; then
    echo ">>> 默认执行初始化和启动操作..."
    create_virtualenv
    install_dependencies
    start_services
else
    case $1 in
        --init)
            create_virtualenv
            install_dependencies
            configure_nginx
            ;;
        --update)
            install_dependencies
            ;;
        --start)
            start_services
            ;;
        --stop)
            stop_services
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

echo "=== 操作完成 ==="
