#!/bin/bash

SERVICE_NAME="easyaussie"
LOG_DIR="/var/log/easyaussie"
PORT=8080  # 如果你监听的是别的端口，比如 8000，请改这里

echo "================= 🛠 EasyAussie 服务状态检查 ================="

# 1. 检查 systemd 状态
echo -e "\n🔍 1. systemd 服务状态 ($SERVICE_NAME):"
sudo systemctl status $SERVICE_NAME --no-pager | head -n 20

# 2. 检查 gunicorn 是否运行中
echo -e "\n🔍 2. Gunicorn 进程检查:"
ps aux | grep gunicorn | grep -v grep

# 3. 检查端口是否监听
echo -e "\n🔍 3. 检查是否监听端口 $PORT:"
sudo lsof -i :$PORT

# 4. 检查日志目录是否存在
echo -e "\n📁 4. 日志目录检查:"
if [ -d "$LOG_DIR" ]; then
    echo "✅ 日志目录存在: $LOG_DIR"
else
    echo "❌ 日志目录不存在: $LOG_DIR"
fi

# 5. 查看最近日志（最多 20 行）
echo -e "\n🧾 5. 查看日志内容 ($LOG_DIR/app.log):"
if [ -f "$LOG_DIR/app.log" ]; then
    sudo tail -n 20 "$LOG_DIR/app.log"
else
    echo "⚠️ 未找到 app.log 文件"
fi

echo -e "\n✅ 状态检查完成！"
