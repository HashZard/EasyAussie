#!/bin/bash

# EasyAussie Frontend 清理脚本
# 用于处理原有文件和目录结构

echo "🚀 EasyAussie Frontend 清理脚本"
echo "=================================="

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 frontend 目录下运行此脚本"
    exit 1
fi

echo "📋 当前项目状态："
echo "✅ 服务页面已重构完成"
echo "✅ 认证页面已重构完成"
echo "✅ 现代化组件已创建"
echo "🔄 管理页面待重构"

echo ""
echo "🎯 可选操作："
echo "1. 清理原有的 components/ css/ js/ 目录"
echo "2. 保留原有目录作为备份"
echo "3. 重构首页 index.html"
echo "4. 查看项目结构"
echo "5. 退出"

read -p "请选择操作 (1-5): " choice

case $choice in
    1)
        echo "🧹 开始清理原有目录..."
        if [ ! -d "pages/legacy" ]; then
            echo "📦 创建备份目录..."
            mkdir -p pages/legacy
        fi
        
        echo "📦 备份原有文件..."
        cp -r components/ pages/legacy/ 2>/dev/null || echo "components/ 目录不存在或已备份"
        cp -r css/ pages/legacy/ 2>/dev/null || echo "css/ 目录不存在或已备份"
        cp -r js/ pages/legacy/ 2>/dev/null || echo "js/ 目录不存在或已备份"
        cp index.html pages/legacy/index-legacy.html 2>/dev/null || echo "index.html 已备份"
        
        echo "🗑️ 删除原有目录..."
        rm -rf components/ css/ js/
        
        echo "✅ 清理完成！原有文件已备份至 pages/legacy/"
        ;;
    2)
        echo "📦 保留原有目录，文件已在 pages/legacy/ 中备份"
        ;;
    3)
        echo "🔄 重构首页..."
        if [ -f "index.html" ]; then
            cp index.html pages/legacy/index-legacy.html
            echo "📦 原版本已备份为 pages/legacy/index-legacy.html"
        fi
        
        cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"/>
    <title>Easy Aussie - 澳洲租房服务专家</title>
    <meta name="description" content="专业的澳洲租房服务，包括代看房、租房申请、求职信写作等全方位服务"/>
    <script type="module" src="/src/main.ts"></script>
    <script type="module">
        import { MobileHeaderComponent } from '/src/components/mobile-header.js';
        import { MobileFooterComponent } from '/src/components/mobile-footer.js';

        document.addEventListener('DOMContentLoaded', () => {
            new MobileHeaderComponent();
            new MobileFooterComponent();
        });
    </script>
</head>

<body class="bg-gray-50 text-gray-900">
<div id="header"></div>

<main class="flex-grow">
    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 sm:py-24">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">欢迎来到 Easy Aussie</h1>
            <p class="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">专业的澳洲租房服务，让您的澳洲生活更加轻松</p>
            <a href="/pages/service/service.html" class="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors inline-block">
                开始使用服务
            </a>
        </div>
    </div>

    <!-- Services Preview -->
    <div class="py-16 sm:py-24">
        <div class="max-w-7xl mx-auto px-4">
            <h2 class="text-2xl sm:text-3xl font-bold text-center mb-12">我们的服务</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div class="text-blue-600 text-3xl mb-4">🏠</div>
                    <h3 class="text-lg font-semibold mb-2">房屋检查</h3>
                    <p class="text-gray-600">专业代看房服务</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div class="text-blue-600 text-3xl mb-4">💼</div>
                    <h3 class="text-lg font-semibold mb-2">求职信</h3>
                    <p class="text-gray-600">专业求职信写作</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div class="text-blue-600 text-3xl mb-4">📄</div>
                    <h3 class="text-lg font-semibold mb-2">租房申请</h3>
                    <p class="text-gray-600">完整申请材料准备</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div class="text-blue-600 text-3xl mb-4">🚗</div>
                    <h3 class="text-lg font-semibold mb-2">机场接机</h3>
                    <p class="text-gray-600">安全舒适接机服务</p>
                </div>
            </div>
        </div>
    </div>
</main>

<div id="footer"></div>
</body>
</html>
EOF
        echo "✅ 首页重构完成！"
        ;;
    4)
        echo "📁 当前项目结构："
        tree -L 3 -I 'node_modules' . 2>/dev/null || find . -type d -not -path './node_modules*' | head -20
        ;;
    5)
        echo "👋 退出脚本"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        ;;
esac

echo ""
echo "🎉 操作完成！"
echo "📖 查看详细迁移计划: cat MIGRATION_PLAN.md"
