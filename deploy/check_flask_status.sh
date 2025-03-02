#!/bin/bash

PROJECT_PATH="/var/www/EasyAussie-Form"
VENV_PATH="$PROJECT_PATH/venv"
SERVICE_NAME="easyaussie"
NGINX_CONF="/etc/nginx/sites-available/easyaussie-form"
FLASK_PORT=8080
FLASK_API_URL="http://127.0.0.1:$FLASK_PORT/inspect/submit"

echo "=== 🚀 Flask 服务状态检测脚本 ==="

# 1️⃣ 检查 Flask 进程是否在运行
echo -e "\n🔍 检查 Flask 进程..."
FLASK_PROCESS=$(ps aux | grep gunicorn | grep -v grep)
if [ -z "$FLASK_PROCESS" ]; then
    echo "❌ Flask (Gunicorn) 未运行"
else
    echo "✅ Flask 进程运行中:"
    echo "$FLASK_PROCESS"
fi

# 2️⃣ 检查 Flask 是否监听 8080 端口
echo -e "\n🔍 检查 Flask 监听的端口..."
LISTENING_PORT=$(sudo netstat -tulnp | grep $FLASK_PORT)
if [ -z "$LISTENING_PORT" ]; then
    echo "❌ Flask 没有监听端口 $FLASK_PORT"
else
    echo "✅ Flask 正在监听端口 $FLASK_PORT"
    echo "$LISTENING_PORT"
fi

# 3️⃣ 检查 systemd 服务状态
echo -e "\n🔍 检查 systemd 服务状态 ($SERVICE_NAME)..."
sudo systemctl is-active --quiet $SERVICE_NAME
if [ $? -ne 0 ]; then
    echo "❌ systemd 服务 ($SERVICE_NAME) 未运行"
else
    echo "✅ systemd 服务 ($SERVICE_NAME) 正在运行"
fi
echo ">>> 详细状态:"
sudo systemctl status $SERVICE_NAME --no-pager --lines=10

# 4️⃣ 检查 Flask 是否可以通过 API 访问
echo -e "\n🔍 通过 curl 测试 Flask API ($FLASK_API_URL)..."
API_RESPONSE=$(curl -X POST $FLASK_API_URL -H "Content-Type: application/json" -d '{"test":"data"}' --silent --write-out "%{http_code}" --output /dev/null)

if [ "$API_RESPONSE" -eq 200 ]; then
    echo "✅ Flask API 正常返回 HTTP 200"
else
    echo "❌ Flask API 访问失败 (HTTP $API_RESPONSE)"
fi

# 5️⃣ 检查 Nginx 配置
echo -e "\n🔍 检查 Nginx 配置..."
if [ -f "$NGINX_CONF" ]; then
    echo "✅ Nginx 配置文件存在: $NGINX_CONF"
    sudo nginx -t
else
    echo "❌ Nginx 配置文件不存在: $NGINX_CONF"
fi

# 6️⃣ 检查 Nginx 是否运行
echo -e "\n🔍 检查 Nginx 进程..."
NGINX_PROCESS=$(ps aux | grep nginx | grep -v grep)
if [ -z "$NGINX_PROCESS" ]; then
    echo "❌ Nginx 未运行"
else
    echo "✅ Nginx 运行中"
    echo "$NGINX_PROCESS"
fi

# 7️⃣ 检查 80/8080 端口是否被防火墙阻挡
echo -e "\n🔍 检查防火墙和安全组 (iptables)..."
sudo iptables -L -n | grep -E "80|$FLASK_PORT"

# 8️⃣ 服务器可用内存检查
echo -e "\n🔍 检查服务器可用内存..."
free -h

echo -e "\n✅ **检测完成** ✅"
