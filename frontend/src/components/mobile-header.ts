/**
 * 移动端优化的头部组件
 * 响应式设计，支持移动端导航抽屉
 */

import { authStore } from '../stores/auth-store';

export class MobileHeaderComponent {
    private container: HTMLElement;
    private isMenuOpen = false;
    private currentUser: any = null;

    constructor(containerId: string = 'header') {
        this.container = document.getElementById(containerId) || document.body;
        this.initializeComponent();
    }

    private async initializeComponent(): Promise<void> {
        await this.initializeAuth();
        this.render();
        this.attachEventListeners();
        this.subscribeToAuthChanges();
    }

    private async initializeAuth(): Promise<void> {
        // 先从localStorage快速加载用户信息以提升响应速度
        this.loadUserFromLocalStorage();
        
        // 如果有用户信息，立即渲染以提升用户体验
        if (this.currentUser) {
            this.render();
            this.attachEventListeners();
        }
        
        // 然后等待authStore的后台验证完成
        await this.validateUserInBackground();
    }

    /**
     * 从localStorage快速加载用户信息，提升响应速度
     */
    private loadUserFromLocalStorage(): void {
        try {
            const storedUser = localStorage.getItem('current_user');
            const storedToken = localStorage.getItem('auth_token');
            
            if (storedUser && storedToken) {
                this.currentUser = JSON.parse(storedUser);
            }
        } catch (error) {
            console.warn('从localStorage加载用户信息失败:', error);
            this.currentUser = null;
        }
    }

    /**
     * 在后台验证用户状态，确保数据准确性
     */
    private async validateUserInBackground(): Promise<void> {
        try {
            // 等待authStore初始化并验证用户
            await this.waitForAuthStoreReady();
            
            const authStoreUser = authStore.getCurrentUser();
            
            // 如果authStore的用户状态与本地不同，更新UI
            if (JSON.stringify(this.currentUser) !== JSON.stringify(authStoreUser)) {
                this.currentUser = authStoreUser;
                this.render();
                this.attachEventListeners();
            }
        } catch (error) {
            console.warn('后台验证用户状态失败:', error);
        }
    }

    private async waitForAuthStoreReady(): Promise<void> {
        // 给 authStore 更多时间来从 localStorage 恢复状态并验证用户
        return new Promise((resolve) => {
            const maxAttempts = 20; // 增加到20次，因为需要等待后端验证
            let attempts = 0;
            
            const checkAuth = () => {
                attempts++;
                const currentUser = authStore.getCurrentUser();
                
                if (currentUser || attempts >= maxAttempts) {
                    resolve();
                    return;
                }
                
                // 继续等待
                setTimeout(checkAuth, 50);
            };
            
            checkAuth();
        });
    }

    private subscribeToAuthChanges(): void {
        authStore.subscribe((user) => {
            // 只有当用户状态真的改变时才重新渲染
            if (JSON.stringify(this.currentUser) !== JSON.stringify(user)) {
                this.currentUser = user;
                this.render();
                this.attachEventListeners();
            }
        });
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
                                ${this.currentUser && this.currentUser.roles?.includes('admin') ? `
                                    <a href="/pages/admin/index.html" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors">管理中心</a>
                                ` : ''}
                                ${this.renderDesktopAuthSection()}
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
                            <button id="mobile-menu-button" class="w-12 h-12 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors touch-manipulation flex items-center justify-center">
                                <i class="fas fa-bars text-xl"></i>
                            </button>
                        </div>
                    </div>

                    <!-- 移动端导航菜单 -->
                    <div id="mobile-menu" class="hidden bg-white border-t border-gray-200">
                        <div class="px-4 py-2 space-y-1">
                            <a href="/" class="block px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors touch-manipulation">
                                <i class="fas fa-home w-6"></i>
                                首页
                            </a>
                            <a href="/pages/service/service.html" class="block px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors touch-manipulation">
                                <i class="fas fa-concierge-bell w-6"></i>
                                服务预约
                            </a>
                            ${this.currentUser && this.currentUser.roles?.includes('admin') ? `
                                <a href="/pages/admin/index.html" class="block px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors touch-manipulation">
                                    <i class="fas fa-cog w-6"></i>
                                    管理中心
                                </a>
                            ` : ''}
                            ${this.renderMobileAuthSection()}
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    private renderDesktopAuthSection(): string {
        if (this.currentUser) {
            return `
                <div class="relative">
                    <button id="user-menu-button" class="flex items-center text-gray-700 hover:text-blue-600 px-4 py-3 rounded-md transition-colors touch-manipulation">
                        <i class="fas fa-user-circle text-xl mr-2"></i>
                        <span class="hidden md:inline">${this.currentUser.email}</span>
                        <i class="fas fa-chevron-down ml-1"></i>
                    </button>
                    <div id="user-menu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                        <div class="py-1">
                        
                            <a href="/pages/user/index.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <i class="fas fa-user mr-2"></i>个人中心
                            </a>
                            <a href="/pages/user/index.html?page=orders" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <i class="fas fa-list mr-2"></i>我的订单
                            </a>
                            <div class="border-t border-gray-100"></div>
                                                        <button class="logout-btn w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                <i class="fas fa-sign-out-alt mr-2"></i>退出登录
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return '<a href="/pages/auth/login.html" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">登录</a>';
        }
    }

    private renderMobileAuthSection(): string {
        if (this.currentUser) {
            return `
                <div class="border-t border-gray-200 mt-2 pt-2">
                    <div class="px-3 py-2">
                        <div class="text-sm font-medium text-gray-500">登录身份</div>
                        <div class="text-base font-medium text-gray-900">${this.currentUser.email}</div>
                    </div>
                    <a href="/pages/user/index.html" class="block px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors touch-manipulation">
                        <i class="fas fa-user w-6"></i>
                        个人中心
                    </a>
                    <a href="/pages/user/index.html?page=orders" class="block px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors touch-manipulation">
                        <i class="fas fa-list w-6"></i>
                        我的订单
                    </a>
                    <button class="logout-btn w-full text-left block px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors touch-manipulation">
                        <i class="fas fa-sign-out-alt w-6"></i>
                        退出登录
                    </button>
                </div>
            `;
        } else {
            return `
                <a href="/pages/auth/login.html" class="block px-3 py-3 text-base font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors touch-manipulation">
                    <i class="fas fa-sign-in-alt w-6"></i>
                    登录
                </a>
            `;
        }
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

        // 桌面端用户菜单事件
        this.attachUserMenuEvents();
    }

    private attachUserMenuEvents(): void {
        const userMenuButton = this.container.querySelector('#user-menu-button') as HTMLButtonElement;
        const userMenu = this.container.querySelector('#user-menu') as HTMLElement;

        if (userMenuButton && userMenu) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.classList.toggle('hidden');
            });

            // 点击外部关闭用户菜单
            document.addEventListener('click', (e) => {
                if (!userMenuButton.contains(e.target as Node) && !userMenu.contains(e.target as Node)) {
                    userMenu.classList.add('hidden');
                }
            });
        }

        // 绑定退出登录事件
        const logoutButtons = this.container.querySelectorAll('.logout-btn');
        logoutButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        });
    }

    private async handleLogout(): Promise<void> {
        try {
            await authStore.logout();
            // 用户状态会通过 subscribe 自动更新 UI
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
            // 即使退出失败，也清除本地状态
            window.location.href = '/pages/auth/login.html';
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

// 导出供外部使用，不自动初始化
// 因为在 main.ts 中已经处理了初始化
