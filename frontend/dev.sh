#!/bin/bash

# EasyAussie 前端开发环境启动脚本

set -e

# 确保在正确的目录中执行
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 启动 EasyAussie 前端开发环境..."
echo "📁 工作目录: $(pwd)"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 npm/yarn
if command -v yarn &> /dev/null; then
    PKG_MANAGER="yarn"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
else
    echo "❌ 包管理器未找到，请安装 npm 或 yarn"
    exit 1
fi

echo "📦 使用包管理器: $PKG_MANAGER"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    $PKG_MANAGER install
else
    echo "✅ 依赖已存在"
fi

# 启动开发服务器
echo "🔥 启动开发服务器..."
echo "🌐 访问地址: http://localhost:3000"
echo "📡 API 代理: http://localhost:5000"
echo ""
echo "按 Ctrl+C 停止服务器"

if [ "$PKG_MANAGER" = "yarn" ]; then
    yarn dev
else
    npm run dev
fi
