#!/bin/bash

PROJECT_PATH="/var/www/EasyAussie-Form"
VENV_PATH="$PROJECT_PATH/venv"
SERVICE_FILE="/etc/systemd/system/easyaussie.service"
NGINX_CONF_PATH="/etc/nginx/sites-available/easyaussie-form"
REQUIREMENTS_FILE="$PROJECT_PATH/requirements.txt"
REQUIREMENTS_HASH_FILE="$PROJECT_PATH/.requirements.md5"

# 输出使用说明
function usage() {
    echo "Usage: setup.sh [options]"
    echo "Options:"
    echo "  --full-setup       完整部署，创建虚拟环境、安装依赖、配置服务"
    echo "  --only-update      仅更新代码并重启服务"
    echo "  --help             显示帮助信息"
}

# 创建虚拟环境
function create_virtualenv() {
    if [ ! -d "$VENV_PATH" ]; then
        echo ">>> 创建虚拟环境..."
        python3 -m venv $VENV_PATH || { echo "虚拟环境创建失败"; exit 1; }
    fi
}

# 安装依赖（仅在 requirements.txt 更新时执行）
function install_dependencies() {
    if [ ! -f "$REQUIREMENTS_HASH_FILE" ] || ! md5sum -c "$REQUIREMENTS_HASH_FILE" &>/dev/null; then
        echo ">>> 安装或更新 Python 依赖..."
        source $VENV_PATH/bin/activate || { echo "激活虚拟环境失败"; exit 1; }
        pip install -r $REQUIREMENTS_FILE || { echo "依赖安装失败"; exit 1; }
        md5sum $REQUIREMENTS_FILE > $REQUIREMENTS_HASH_FILE  # 更新校验值
    else
        echo ">>> 依赖已是最新，无需重新安装。"
    fi
}

# 配置服务
function configure_services() {
    echo ">>> 配置 Systemd 和 Nginx 服务..."

    # 复制 Systemd 服务文件
    sudo cp $PROJECT_PATH/deploy/easyaussie.service $SERVICE_FILE || { echo "复制 Systemd 服务文件失败"; exit 1; }
    sudo systemctl daemon-reload

    # 启用并重启服务
    sudo systemctl restart easyaussie || { echo "服务重启失败"; exit 1; }
    sudo systemctl enable easyaussie

    # 复制 Nginx 配置文件
    sudo cp $PROJECT_PATH/deploy/nginx.conf $NGINX_CONF_PATH || { echo "复制 Nginx 配置文件失败"; exit 1; }
    sudo ln -sf $NGINX_CONF_PATH /etc/nginx/sites-enabled/easyaussie-form
    sudo nginx -t || { echo "Nginx 配置测试失败"; exit 1; }
    sudo systemctl restart nginx
}

# 更新代码
function update_code() {
    echo ">>> 拉取最新代码..."
    cd $PROJECT_PATH || { echo "无法进入目录：$PROJECT_PATH"; exit 1; }
    git pull origin master || { echo "代码更新失败"; exit 1; }
}

# 检查参数并执行对应操作
if [ $# -eq 0 ]; then
    echo ">>> 默认执行更新操作..."
    update_code
    install_dependencies
    sudo systemctl restart easyaussie
    sudo systemctl restart nginx
else
    case $1 in
        --full-setup)
            update_code
            create_virtualenv
            install_dependencies
            configure_services
            ;;
        --only-update)
            update_code
            install_dependencies
            sudo systemctl restart easyaussie
            sudo systemctl restart nginx
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

echo "=== 部署完成 ==="
