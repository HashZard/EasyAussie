/**
 * 移动端优化的头部组件
 * 响应式设计，支持移动端导航抽屉
 */

export class MobileHeaderComponent {
    private container: HTMLElement;
    private isMenuOpen = false;

    constructor(containerId: string = 'header') {
        this.container = document.getElementById(containerId) || document.body;
        this.render();
        this.attachEventListeners();
    }

    private render(): void {
        this.container.innerHTML = `
            <header class="bg-white shadow-sm sticky top-0 z-50">
                <!-- 桌面端头部 -->
                <div class="hidden lg:block">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between items-center h-16">
                            <div class="flex items-center">
                                <a href="/" class="text-2xl font-bold text-blue-600">
                                    Easy Aussie
                                </a>
                            </div>
                            <nav class="flex space-x-8">
                                <a href="/" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors">首页</a>
                                <a href="/pages/service/service.html" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors">服务预约</a>
                                <a href="/pages/management/admin.html" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors">管理中心</a>
                                <a href="/pages/auth/login.html" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">登录</a>
                            </nav>
                        </div>
                    </div>
                </div>

                <!-- 移动端头部 -->
                <div class="lg:hidden">
                    <div class="px-4 sm:px-6">
                        <div class="flex justify-between items-center h-16">
                            <!-- Logo -->
                            <a href="/" class="text-xl font-bold text-blue-600">
                                Easy Aussie
                            </a>
                            
                            <!-- 汉堡菜单按钮 -->
                            <button id="mobile-menu-button" class="p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors">
                                <i class="fas fa-bars text-xl"></i>
                            </button>
                        </div>
                    </div>

                    <!-- 移动端导航菜单 -->
                    <div id="mobile-menu" class="hidden bg-white border-t border-gray-200">
                        <div class="px-4 py-2 space-y-1">
                            <a href="/" class="block px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors">
                                <i class="fas fa-home w-6"></i>
                                首页
                            </a>
                            <a href="/pages/service/service.html" class="block px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors">
                                <i class="fas fa-concierge-bell w-6"></i>
                                服务预约
                            </a>
                            <a href="/pages/management/admin.html" class="block px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors">
                                <i class="fas fa-cog w-6"></i>
                                管理中心
                            </a>
                            <a href="/pages/auth/login.html" class="block px-3 py-3 text-base font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors">
                                <i class="fas fa-sign-in-alt w-6"></i>
                                登录
                            </a>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    private attachEventListeners(): void {
        const menuButton = this.container.querySelector('#mobile-menu-button') as HTMLButtonElement;
        const mobileMenu = this.container.querySelector('#mobile-menu') as HTMLElement;

        if (menuButton && mobileMenu) {
            menuButton.addEventListener('click', () => {
                this.toggleMenu(mobileMenu, menuButton);
            });

            // 点击外部关闭菜单
            document.addEventListener('click', (e) => {
                if (!menuButton.contains(e.target as Node) && !mobileMenu.contains(e.target as Node)) {
                    this.closeMenu(mobileMenu, menuButton);
                }
            });

            // 窗口大小变化时关闭移动端菜单
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 1024) { // lg breakpoint
                    this.closeMenu(mobileMenu, menuButton);
                }
            });
        }
    }

    private toggleMenu(menu: HTMLElement, button: HTMLButtonElement): void {
        this.isMenuOpen = !this.isMenuOpen;
        
        if (this.isMenuOpen) {
            menu.classList.remove('hidden');
            button.innerHTML = '<i class="fas fa-times text-xl"></i>';
            // 防止背景滚动
            document.body.style.overflow = 'hidden';
        } else {
            menu.classList.add('hidden');
            button.innerHTML = '<i class="fas fa-bars text-xl"></i>';
            document.body.style.overflow = '';
        }
    }

    private closeMenu(menu: HTMLElement, button: HTMLButtonElement): void {
        this.isMenuOpen = false;
        menu.classList.add('hidden');
        button.innerHTML = '<i class="fas fa-bars text-xl"></i>';
        document.body.style.overflow = '';
    }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    new MobileHeaderComponent();
});
