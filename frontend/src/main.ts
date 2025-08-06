// 主入口文件 - 初始化应用
import './styles/main.css';
import { authStore } from './stores/auth-store';
import { notificationService } from './services/notification-service';
import { httpClient } from './services/http-client';
import mobileLayoutManager from './services/mobile-layout-manager';

/**
 * 应用程序主类
 * 负责初始化全局功能和状态管理
 */
class EasyAussieApp {
  private isInitialized = false;

  constructor() {
    this.init();
  }

  /**
   * 初始化应用
   */
  private async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 显示移动端加载器
      mobileLayoutManager.showPageLoader();

      // 等待 DOM 准备就绪
      await this.waitForDOM();

      // 初始化全局服务
      this.initializeServices();

      // 初始化布局组件
      await this.initializeLayout();

      // 初始化权限控制
      this.initializePermissions();

      // 标记为已初始化
      this.isInitialized = true;

      // 隐藏加载器
      setTimeout(() => {
        mobileLayoutManager.hidePageLoader();
      }, 800);

      console.log('🚀 EasyAussie App initialized successfully');
      
      // 显示设备信息（开发环境）
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 Device Info:', mobileLayoutManager.getDeviceInfo());
      }
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      mobileLayoutManager.hidePageLoader();
      notificationService.error('应用初始化失败，请刷新页面重试');
    }
  }

  /**
   * 等待 DOM 准备就绪
   */
  private waitForDOM(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve());
      } else {
        resolve();
      }
    });
  }

  /**
   * 初始化全局服务
   */
  private initializeServices(): void {
    // 将服务挂载到全局对象，供模板使用
    (window as any).authStore = authStore;
    (window as any).notificationService = notificationService;
    (window as any).httpClient = httpClient;
    (window as any).mobileLayoutManager = mobileLayoutManager;

    // 设置全局错误处理
    this.setupGlobalErrorHandling();
  }

  /**
   * 初始化布局组件
   */
  private async initializeLayout(): Promise<void> {
    try {
      // 获取用户信息
      const user = await authStore.fetchUserProfile();

      // 并行加载布局组件
      await Promise.all([
        this.loadComponent('header'),
        this.loadComponent('footer'),
        this.loadComponent('back-button'),
      ]);

      // 更新用户状态显示
      this.updateUserInterface(user);
    } catch (error) {
      console.warn('Failed to initialize layout:', error);
    }
  }

  /**
   * 加载组件
   */
  private async loadComponent(name: string): Promise<void> {
    const container = document.getElementById(name);
    if (!container) return;

    try {
      const response = await fetch(`/components/${name}.html`);
      if (response.ok) {
        const html = await response.text();
        container.innerHTML = html;
        
        // 触发组件加载事件
        const event = new CustomEvent(`${name}Loaded`, {
          detail: { container },
          bubbles: true,
        });
        document.dispatchEvent(event);
      }
    } catch (error) {
      console.warn(`Failed to load ${name} component:`, error);
    }
  }

  /**
   * 更新用户界面
   */
  private updateUserInterface(_user: any): void {
    // 订阅用户状态变化
    authStore.subscribe((currentUser) => {
      this.updateHeaderStatus(currentUser);
      this.updateNavigationPermissions(currentUser);
    });
  }

  /**
   * 更新头部状态
   */
  private updateHeaderStatus(user: any): void {
    const avatarSection = document.getElementById('userAvatarSection');
    const loginButton = document.getElementById('loginButton');

    if (!avatarSection || !loginButton) return;

    if (user) {
      avatarSection.classList.remove('hidden');
      loginButton.classList.add('hidden');
      
      // 更新用户邮箱显示
      const emailElements = document.querySelectorAll('.user-email');
      emailElements.forEach(el => {
        el.textContent = user.email;
      });
    } else {
      avatarSection.classList.add('hidden');
      loginButton.classList.remove('hidden');
    }
  }

  /**
   * 更新导航权限
   */
  private updateNavigationPermissions(user: any): void {
    document.querySelectorAll('.role-required').forEach(element => {
      const requiredRole = (element as HTMLElement).dataset.role;
      const hasPermission = user?.roles?.includes(requiredRole);
      
      (element as HTMLElement).style.display = hasPermission ? '' : 'none';
    });
  }

  /**
   * 初始化权限控制
   */
  private initializePermissions(): void {
    const body = document.body;
    const requiredRole = body.dataset.requiredRole;

    if (requiredRole) {
      authStore.requireRole(requiredRole).catch(() => {
        // 权限检查失败，会自动跳转
      });
    }
  }

  /**
   * 设置全局错误处理
   */
  private setupGlobalErrorHandling(): void {
    // 捕获未处理的 Promise 错误
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      notificationService.error('发生了意外错误，请稍后重试');
      event.preventDefault();
    });

    // 捕获 JavaScript 错误
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      if (event.error?.message?.includes('Network')) {
        notificationService.error('网络连接错误，请检查网络设置');
      }
    });
  }
}

/**
 * 全局工具函数
 */

// 用户菜单切换
(window as any).toggleUserMenu = function () {
  const user = authStore.getCurrentUser();
  if (!user) return;

  const menu = document.getElementById('userMenuLoggedIn');
  const avatar = document.getElementById('userAvatarSection');
  if (!menu || !avatar) return;

  // 更新邮箱显示
  const emailDiv = menu.querySelector('.text-sm');
  if (emailDiv) {
    emailDiv.innerHTML = `
      <div class="block px-4 py-2 text-gray-600 font-medium">
        <span class="text-blue-600">${user.email}</span>
      </div>
    `;
  }

  // 切换菜单显示
  menu.classList.toggle('hidden');

  // 点击外部关闭菜单
  const closeMenu = (e: Event) => {
    if (!menu.contains(e.target as Node) && !avatar.contains(e.target as Node)) {
      menu.classList.add('hidden');
      document.removeEventListener('click', closeMenu);
    }
  };

  document.removeEventListener('click', closeMenu);
  setTimeout(() => document.addEventListener('click', closeMenu), 0);
};

// 移动端菜单切换
(window as any).toggleMobileMenu = function () {
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileUserSection = document.getElementById('mobileUserSection');
  const user = authStore.getCurrentUser();

  if (!mobileMenu || !mobileUserSection) return;

  mobileMenu.classList.toggle('hidden');
  document.body.classList.toggle('overflow-hidden');

  if (user) {
    mobileUserSection.innerHTML = `
      <div class="border-t border-blue-500 pt-4 mt-4">
        <div class="block px-4 py-2 text-sm text-white font-medium border-b border-blue-500">
          ${user.email}
        </div>
        <a href="/pages/management/profile.html" 
           class="block px-4 py-3 text-white hover:bg-blue-500 transition-colors">
          个人中心
        </a>
        <a href="#" 
           onclick="authStore.logout()" 
           class="block px-4 py-3 text-white hover:bg-blue-500 transition-colors">
          退出登录
        </a>
      </div>
    `;
  } else {
    mobileUserSection.innerHTML = `
      <div class="border-t border-blue-500 pt-4 mt-4">
        <a href="/pages/auth/login.html" 
           class="block px-4 py-3 text-white hover:bg-blue-500 transition-colors">
          登录账号
        </a>
      </div>
    `;
  }
};

// 登出函数
(window as any).logout = function () {
  authStore.logout();
};

// 初始化应用
const app = new EasyAussieApp();

// 导出全局实例
export { app };
export default app;
