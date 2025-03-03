#!/bin/bash

PROJECT_PATH="/var/www/EasyAussie-Form"
VENV_PATH="$PROJECT_PATH/venv"
SERVICE_NAME="easyaussie"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
NGINX_CONF_PATH="/etc/nginx/sites-available/easyaussie-form"
REQUIREMENTS_FILE="$PROJECT_PATH/requirements.txt"
REQUIREMENTS_HASH_FILE="$PROJECT_PATH/.requirements.md5"

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
    flask db upgrade || { echo "❌ 数据库迁移失败"; exit 1; }


    echo ">>> 重新启动 Flask (Gunicorn)..."
    sudo systemctl daemon-reload
    sudo systemctl start $SERVICE_NAME
    sudo systemctl enable $SERVICE_NAME

    echo ">>> 重新启动 Nginx..."
    sudo systemctl restart nginx
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
            restart_services
            ;;
        --only-update)
            stop_old_processes
            update_code
            install_dependencies
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
