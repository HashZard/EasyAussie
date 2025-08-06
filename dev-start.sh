#!/bin/bash

# 本地开发环境快速启动脚本
PROJECT_ROOT="/Users/zard/VScodeProject/EasyAussie"
BACKEND_PATH="$PROJECT_ROOT/backend"
FRONTEND_PATH="$PROJECT_ROOT/frontend"

echo "🚀 启动本地开发环境..."

# 停止现有服务
echo "🧹 停止现有服务..."
pkill -f "flask run" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# 检查前端依赖
cd "$FRONTEND_PATH"
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 启动前端开发服务（后台）
echo "🎨 启动前端开发服务 (localhost:3001)..."
npm run dev &
FRONTEND_PID=$!

# 切换到项目根目录准备启动后端
cd "$PROJECT_ROOT"

# 检查Python虚拟环境
if [ ! -d "venv" ]; then
    echo "🐍 创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装后端依赖
if [ -f "requirements.txt" ]; then
    echo "📦 安装后端依赖..."
    pip install -r requirements.txt
fi

# 设置环境变量
export FLASK_APP=backend.app:create_app
export FLASK_ENV=development
export PYTHONPATH="$PROJECT_ROOT"

# 启动后端服务（后台）
echo "🐍 启动后端API服务 (localhost:8000)..."
flask run --port=8000 &
BACKEND_PID=$!

# 等待服务启动
sleep 3

# 检查服务状态
echo "🧪 检查服务状态..."
if curl -s http://localhost:3001 >/dev/null; then
    echo "✅ 前端服务正常 (http://localhost:3001)"
else
    echo "❌ 前端服务启动失败"
fi

if curl -s http://localhost:8000 >/dev/null; then
    echo "✅ 后端服务正常 (http://localhost:8000)"
else
    echo "❌ 后端服务启动失败"
fi

echo ""
echo "🎉 开发环境已启动！"
echo "📋 服务地址："
echo "   🎨 前端: http://localhost:3001 (Vite开发服务器，支持热重载)"
echo "   🐍 后端: http://localhost:8000 (Flask API服务)"
echo ""
echo "💡 提示："
echo "   - 前端进程 PID: $FRONTEND_PID"
echo "   - 后端进程 PID: $BACKEND_PID"
echo "   - 按 Ctrl+C 结束脚本"
echo "   - 或运行: pkill -f 'flask run' && pkill -f 'vite'"
echo ""

# 打开浏览器
open "http://localhost:3001"

# 保持脚本运行
echo "⏳ 按 Ctrl+C 停止所有服务..."
trap 'echo "🛑 停止服务..."; kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; exit' INT
wait
