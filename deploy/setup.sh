#!/bin/bash

echo "开始部署..."

# 项目路径
PROJECT_PATH="/var/www/EasyAussie-Form"

# 拉取最新代码
echo "拉取最新代码..."
cd $PROJECT_PATH || exit
git pull origin main

# 激活虚拟环境并更新依赖
echo "更新 Python 依赖..."
source $PROJECT_PATH/venv/bin/activate
pip install -r $PROJECT_PATH/requirements.txt

# 检查并重启 Nginx 服务
echo "重启 Nginx 服务..."
sudo nginx -t && sudo systemctl restart nginx


# 重启 Systemd 服务
echo "重启 Flask 服务..."
sudo systemctl daemon-reload
sudo systemctl restart easyaussie

echo "部署完成"
