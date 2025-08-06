/**
 * TypeScript版本的SPA基础架构
 * 为管理员和用户系统提供类型安全的基础功能
 */

import { SharedHeader } from './shared-header.js';
import { authStore } from '../stores/auth-store.js';
import type { User } from '../types/auth.js';

export interface PageConfig {
    getContent: () => Promise<string> | string;
    initialize?: () => Promise<void> | void;
}

export interface SPAConfig {
    defaultPage?: string;
    authRequired?: boolean;
    adminRequired?: boolean;
    loginRedirect?: string;
    title?: string;
    subtitle?: string;
    showUserInfo?: boolean;
    showBackToHome?: boolean;
    logoHref?: string;
}

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

/**
 * 基础通知服务类
 */
export class BaseNotificationService {
    private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 3000): void {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${this.getNotificationClasses(type)}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.classList.add('translate-x-0');
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, duration);
    }

    private getNotificationClasses(type: string): string {
        const classes = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        return classes[type as keyof typeof classes] || classes.info;
    }

    success(message: string, duration?: number): void {
        this.showNotification(message, 'success', duration);
    }

    error(message: string, duration?: number): void {
        this.showNotification(message, 'error', duration);
    }

    warning(message: string, duration?: number): void {
        this.showNotification(message, 'warning', duration);
    }

    info(message: string, duration?: number): void {
        this.showNotification(message, 'info', duration);
    }
}

/**
 * SPA基础类
 */
export abstract class SPABase {
    protected config: Required<SPAConfig>;
    protected notificationService: BaseNotificationService;
    protected currentUser: User | null = null;
    protected pages: Map<string, PageConfig> = new Map();
    protected sharedHeader: SharedHeader;

    constructor(config: SPAConfig = {}) {
        this.config = {
            defaultPage: 'dashboard',
            authRequired: true,
            adminRequired: false,
            loginRedirect: '/pages/auth/login.html',
            title: 'Easy Aussie',
            subtitle: '',
            showUserInfo: true,
            showBackToHome: true,
            logoHref: '/',
            ...config
        };
        
        this.notificationService = new BaseNotificationService();
        this.sharedHeader = new SharedHeader();
        
        // 暴露到全局
        (window as any).authStore = authStore;
        (window as any).notificationService = this.notificationService;
    }

    async initialize(): Promise<void> {
        // 检查认证状态
        if (this.config.authRequired) {
            this.currentUser = authStore.getCurrentUser();
            if (!this.currentUser) {
                window.location.href = this.config.loginRedirect;
                return;
            }

            // 检查管理员权限
            if (this.config.adminRequired && !authStore.hasRole('admin')) {
                this.notificationService.error('无权限访问此页面');
                window.location.href = '/';
                return;
            }
        }

        // 渲染用户信息
        this.renderUserInfo();

        // 设置事件监听器
        this.setupEventListeners();

        // 处理路由
        this.handleRouting();
    }

    protected renderUserInfo(): void {
        if (!this.currentUser) return;

        const userInfoElements = document.querySelectorAll('#user-info');
        userInfoElements.forEach(element => {
            element.innerHTML = `
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                        ${this.currentUser!.email.charAt(0).toUpperCase()}
                    </div>
                    <div class="hidden sm:block">
                        <div class="text-sm font-medium text-gray-900">${this.currentUser!.email}</div>
                        <div class="text-xs text-gray-500">${this.getRoleDisplayName(this.currentUser!.roles)}</div>
                    </div>
                </div>
            `;
        });
    }

    protected setupEventListeners(): void {
        // 导航菜单点击事件
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const navItem = target.closest('.nav-item') as HTMLElement;
            if (navItem) {
                e.preventDefault();
                const page = navItem.dataset.page;
                if (page) {
                    this.loadPage(page);
                }
            }
        });

        // 移动端导航点击事件
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const mobileNavItem = target.closest('.mobile-nav-item') as HTMLElement;
            if (mobileNavItem) {
                e.preventDefault();
                const page = mobileNavItem.dataset.page;
                if (page) {
                    this.loadPage(page);
                }
            }
        });

        // 退出登录
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // 移动端菜单切换
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('-translate-x-full');
            });

            // 点击遮罩关闭菜单
            const overlay = document.getElementById('overlay');
            if (overlay) {
                overlay.addEventListener('click', () => {
                    sidebar.classList.add('-translate-x-full');
                });
            }
        }
    }

    protected handleRouting(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page') || this.config.defaultPage;
        this.loadPage(page);
    }

    async loadPage(pageKey: string): Promise<void> {
        try {
            const content = document.getElementById('main-content');
            if (!content) {
                console.error('主内容区域未找到');
                return;
            }

            // 显示加载状态
            content.innerHTML = '<div class="flex items-center justify-center py-12"><div class="text-gray-500">加载中...</div></div>';

            // 更新URL
            const url = new URL(window.location.href);
            url.searchParams.set('page', pageKey);
            window.history.pushState({}, '', url.toString());

            // 获取页面配置
            const pageConfig = this.pages.get(pageKey);
            let htmlContent: string;

            if (pageConfig) {
                htmlContent = await pageConfig.getContent();
            } else {
                htmlContent = '<div class="text-center py-12"><h2 class="text-xl text-gray-500">页面开发中...</h2></div>';
            }

            content.innerHTML = htmlContent;

            // 执行页面特定的初始化脚本
            if (pageConfig && pageConfig.initialize) {
                await pageConfig.initialize();
            }

            // 更新导航状态
            this.updateNavigationState(pageKey);

        } catch (error) {
            console.error('加载页面失败:', error);
            const content = document.getElementById('main-content');
            if (content) {
                content.innerHTML = '<div class="text-center py-12"><h2 class="text-xl text-red-500">页面加载失败</h2></div>';
            }
        }
    }

    registerPages(pagesConfig: Record<string, PageConfig>): void {
        Object.entries(pagesConfig).forEach(([key, config]) => {
            this.pages.set(key, config);
        });
    }

    protected handleLogout(): void {
        authStore.logout();
    }

    protected updateNavigationState(activePage: string): void {
        // 更新桌面端导航状态
        const desktopNavItems = document.querySelectorAll('.nav-item');
        desktopNavItems.forEach(item => {
            const element = item as HTMLElement;
            element.classList.remove('bg-blue-50', 'text-blue-600');
            element.classList.add('text-gray-600');
            
            if (element.dataset.page === activePage) {
                element.classList.remove('text-gray-600');
                element.classList.add('bg-blue-50', 'text-blue-600');
            }
        });

        // 更新移动端导航状态
        const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
        mobileNavItems.forEach(item => {
            const element = item as HTMLElement;
            element.classList.remove('text-blue-600', 'border-blue-600');
            element.classList.add('text-gray-600', 'border-transparent');
            
            if (element.dataset.page === activePage) {
                element.classList.remove('text-gray-600', 'border-transparent');
                element.classList.add('text-blue-600', 'border-blue-600');
            }
        });
    }

    protected getRoleDisplayName(roles?: string[]): string {
        if (roles && Array.isArray(roles) && roles.length > 0) {
            const roleMap: Record<string, string> = {
                'admin': '管理员',
                'paid1': 'VIP用户', 
                'paid2': '高级用户',
                'user': '普通用户'
            };
            return roleMap[roles[0]] || '普通用户';
        }
        
        return '普通用户';
    }

    // 初始化入口方法
    init(): void {
        this.initialize();
    }
}
