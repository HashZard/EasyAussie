#!/bin/bash

echo "=== 开始部署 ==="

# 设置项目路径
PROJECT_PATH="/var/www/EasyAussie-Form"

# 拉取最新代码
echo ">>> 拉取最新代码..."
cd $PROJECT_PATH || { echo "无法进入目录：$PROJECT_PATH"; exit 1; }
git pull origin main || { echo "拉取代码失败"; exit 1; }

# 激活虚拟环境并安装依赖
echo ">>> 更新 Python 依赖..."
source $PROJECT_PATH/venv/bin/activate || { echo "激活虚拟环境失败"; exit 1; }
pip install -r $PROJECT_PATH/requirements.txt || { echo "安装依赖失败"; exit 1; }

# 复制并配置 Systemd 服务
SERVICE_FILE_PATH="/etc/systemd/system/easyaussie.service"
echo ">>> 配置 Systemd 服务..."
sudo cp $PROJECT_PATH/deploy/easyaussie.service $SERVICE_FILE_PATH || { echo "复制 Systemd 服务文件失败"; exit 1; }
sudo systemctl daemon-reload || { echo "重新加载 Systemd 配置失败"; exit 1; }
sudo systemctl restart easyaussie || { echo "重启服务失败"; exit 1; }
sudo systemctl enable easyaussie || { echo "启用服务失败"; exit 1; }

# 复制 Nginx 配置
NGINX_CONF_PATH="/etc/nginx/sites-available/easyaussie-form"
echo ">>> 配置 Nginx..."
sudo cp $PROJECT_PATH/deploy/nginx.conf $NGINX_CONF_PATH || { echo "复制 Nginx 配置失败"; exit 1; }
sudo ln -sf $NGINX_CONF_PATH /etc/nginx/sites-enabled/easyaussie-form || { echo "创建 Nginx 配置链接失败"; exit 1; }

# 测试并重启 Nginx
echo ">>> 重启 Nginx 服务..."
sudo nginx -t || { echo "Nginx 配置测试失败"; exit 1; }
sudo systemctl restart nginx || { echo "重启 Nginx 失败"; exit 1; }

echo "=== 部署完成 ==="
