/**
 * TypeScript版本的共享头部组件
 * 为admin和user系统提供统一、类型安全的头部样式和功能
 */

export interface NavigationItem {
    key: string;
    label: string;
    icon: string;
}

export interface HeaderConfig {
    title?: string;
    subtitle?: string;
    showUserInfo?: boolean;
    showBackToHome?: boolean;
    logoHref?: string;
}

export class SharedHeader {
    private title: string;
    private subtitle: string;
    private showUserInfo: boolean;
    private showBackToHome: boolean;
    private logoHref: string;

    constructor(config: HeaderConfig = {}) {
        this.title = config.title || 'Easy Aussie';
        this.subtitle = config.subtitle || '';
        this.showUserInfo = config.showUserInfo !== false;
        this.showBackToHome = config.showBackToHome !== false;
        this.logoHref = config.logoHref || '/';
    }

    /**
     * 生成头部HTML
     */
    getHeaderHTML(): string {
        return `
            <div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div class="px-4 lg:px-6">
                    <div class="flex items-center justify-end h-16">
                        <!-- 右侧用户信息和操作 -->
                        <div class="flex items-center space-x-4">
                            ${this.showUserInfo ? this.getUserInfoHTML() : ''}
                            ${this.showBackToHome ? `
                                <a href="/" class="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                                    <i class="fas fa-home mr-2"></i>
                                    <span class="hidden sm:inline">返回首页</span>
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 生成用户信息HTML
     */
    private getUserInfoHTML(): string {
        return `
            <!-- 用户信息显示 -->
            <div id="user-info" class="flex items-center">
                <div class="flex items-center animate-pulse">
                    <div class="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                    <div class="hidden sm:block">
                        <div class="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                        <div class="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 生成侧边栏HTML（用于admin系统）
     */
    getSidebarHTML(navigationItems: NavigationItem[] = []): string {
        return `
            <div id="sidebar" class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out">
                <!-- Logo -->
                <div class="flex items-center justify-center h-16 px-4 border-b border-gray-200">
                    <a href="${this.logoHref}" class="text-xl font-bold text-blue-600">${this.title}</a>
                    ${this.subtitle ? `<span class="ml-2 text-sm text-gray-500">${this.subtitle}</span>` : ''}
                </div>

                <!-- 导航菜单 -->
                <nav class="flex-1 px-4 py-4 space-y-2">
                    ${navigationItems.map(item => `
                        <a href="#" class="nav-item flex items-center px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors" data-page="${item.key}">
                            <i class="${item.icon} w-5 mr-3"></i>
                            ${item.label}
                        </a>
                    `).join('')}
                    
                    <div class="pt-4 mt-4 border-t border-gray-200">
                        <a href="#" id="logout-btn" class="flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                            <i class="fas fa-sign-out-alt w-5 mr-3"></i>
                            退出登录
                        </a>
                    </div>
                </nav>
            </div>
        `;
    }

    /**
     * 生成桌面端侧边栏HTML（用于user系统）
     */
    getDesktopSidebarHTML(navigationItems: NavigationItem[] = []): string {
        return `
            <div class="hidden lg:block w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
                <!-- 导航菜单 -->
                <nav class="p-4 space-y-2">
                    ${navigationItems.map(item => `
                        <a href="#" class="nav-item flex items-center px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors" data-page="${item.key}">
                            <i class="${item.icon} w-5 mr-3"></i>
                            ${item.label}
                        </a>
                    `).join('')}
                </nav>
            </div>
        `;
    }

    /**
     * 生成移动端标签导航HTML（用于user系统）
     */
    getMobileTabsHTML(navigationItems: NavigationItem[] = []): string {
        return `
            <div class="lg:hidden bg-white border-b border-gray-200">
                <nav class="flex">
                    ${navigationItems.map(item => `
                        <button class="mobile-nav-item flex-1 flex items-center justify-center px-4 py-4 text-gray-600 hover:text-blue-600 border-b-2 border-transparent transition-colors" data-page="${item.key}">
                            <i class="${item.icon} mr-2"></i>
                            <span class="text-sm">${item.label}</span>
                        </button>
                    `).join('')}
                </nav>
            </div>
        `;
    }

    /**
     * 生成移动端顶部标签导航HTML（用于admin系统）
     */
    getMobileTopTabsHTML(navigationItems: NavigationItem[] = []): string {
        return `
            <div class="lg:hidden bg-white border-b border-gray-200">
                <nav class="flex overflow-x-auto">
                    ${navigationItems.map(item => `
                        <button class="mobile-nav-item flex-shrink-0 px-6 py-4 text-gray-600 hover:text-blue-600 border-b-2 border-transparent transition-colors" data-page="${item.key}">
                            <i class="${item.icon} mr-2"></i>
                            <span class="text-sm">${item.label}</span>
                        </button>
                    `).join('')}
                </nav>
            </div>
        `;
    }
}
