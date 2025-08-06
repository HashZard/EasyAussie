import { httpClient } from '../services/http-client';
import type { User, LoginCredentials, RegisterData, AuthResponse, AuthConfig } from '../types/auth';

/**
 * 现代化的用户认证存储和管理
 * 提供响应式状态管理、自动刷新、安全存储等功能
 */
export class AuthStore {
  private user: User | null = null;
  private token: string | null = null;
  private subscribers: Set<(user: User | null) => void> = new Set();
  private config: AuthConfig;

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = {
      tokenKey: 'auth_token',
      userKey: 'current_user',
      refreshTokenKey: 'refresh_token',
      loginPath: '/pages/auth/login.html',
      defaultRedirectPath: '/index.html',
      ...config,
    };

    this.initializeAuth();
    this.setupHttpInterceptors();
  }

  /**
   * 初始化认证状态
   */
  private initializeAuth(): void {
    try {
      const storedToken = localStorage.getItem(this.config.tokenKey);
      const storedUser = localStorage.getItem(this.config.userKey);

      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
        this.validateAndRefreshUser();
      }
    } catch (error) {
      console.warn('Failed to initialize auth from storage:', error);
      this.clearAuth();
    }
  }

  /**
   * 设置 HTTP 拦截器
   */
  private setupHttpInterceptors(): void {
    // 请求拦截器：自动添加认证头
    httpClient.addRequestInterceptor((config) => {
      if (this.token && !config.headers?.Authorization) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${this.token}`,
        };
      }
      return config;
    });

    // 响应拦截器：处理认证失败
    httpClient.addResponseInterceptor(async (response) => {
      if (response.status === 401 || response.status === 403) {
        await this.handleAuthError();
      }
      return response;
    });
  }

  /**
   * 订阅用户状态变化
   */
  subscribe(callback: (user: User | null) => void): () => void {
    this.subscribers.add(callback);
    // 立即调用一次以获取当前状态
    callback(this.user);
    
    // 返回取消订阅函数
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * 通知所有订阅者
   */
  private notify(): void {
    this.subscribers.forEach(callback => callback(this.user));
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * 获取当前用户邮箱
   */
  getCurrentEmail(): string | null {
    return this.user?.email || null;
  }

  /**
   * 检查用户是否有特定角色
   */
  hasRole(role: string): boolean {
    return this.user?.roles?.includes(role) ?? false;
  }

  /**
   * 检查用户是否已认证
   */
  isAuthenticated(): boolean {
    return !!(this.user && this.token);
  }

  /**
   * 登录
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await httpClient.post<AuthResponse>('/api/login', {
        email: credentials.email,
        password: credentials.password,
        captcha: credentials.captcha,
      });
      
      if (response.success && response.data) {
        await this.setAuthData(response.data.user, response.data.token);
        return response.data.user;
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * 注册
   */
  async register(data: RegisterData): Promise<User> {
    try {
      const response = await httpClient.post<AuthResponse>('/api/auth/register', data);
      
      if (response.success && response.data) {
        await this.setAuthData(response.data.user, response.data.token);
        return response.data.user;
      }
      
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      await httpClient.post('/api/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearAuth();
      window.location.href = this.config.defaultRedirectPath;
    }
  }

  /**
   * 获取用户信息
   */
  async fetchUserProfile(): Promise<User | null> {
    try {
      const response = await httpClient.get<User>('/api/profile');
      
      if (response.success && response.data) {
        this.setUser(response.data);
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to fetch user profile:', error);
      return null;
    }
  }

  /**
   * 验证并刷新用户信息
   */
  private async validateAndRefreshUser(): Promise<void> {
    try {
      const user = await this.fetchUserProfile();
      if (!user) {
        this.clearAuth();
      }
    } catch (error) {
      console.warn('Failed to validate user:', error);
      this.clearAuth();
    }
  }

  /**
   * 设置认证数据
   */
  private async setAuthData(user: User, token: string): Promise<void> {
    this.user = user;
    this.token = token;
    
    // 安全存储
    localStorage.setItem(this.config.tokenKey, token);
    localStorage.setItem(this.config.userKey, JSON.stringify(user));
    
    this.notify();
  }

  /**
   * 设置用户信息
   */
  private setUser(user: User): void {
    this.user = user;
    localStorage.setItem(this.config.userKey, JSON.stringify(user));
    this.notify();
  }

  /**
   * 清除认证信息
   */
  private clearAuth(): void {
    this.user = null;
    this.token = null;
    
    localStorage.removeItem(this.config.tokenKey);
    localStorage.removeItem(this.config.userKey);
    localStorage.removeItem(this.config.refreshTokenKey!);
    
    this.notify();
  }

  /**
   * 处理认证错误
   */
  private async handleAuthError(): Promise<void> {
    console.warn('Authentication failed, redirecting to login');
    this.clearAuth();
    
    const currentPath = encodeURIComponent(window.location.pathname);
    window.location.href = `${this.config.loginPath}?next=${currentPath}`;
  }

  /**
   * 强制要求特定角色
   */
  async requireRole(role: string): Promise<void> {
    if (!this.isAuthenticated()) {
      await this.handleAuthError();
      return;
    }

    if (!this.hasRole(role)) {
      alert('无权限访问本页面');
      window.location.href = this.config.defaultRedirectPath;
    }
  }

  /**
   * 强制要求登录
   */
  async requireAuth(): Promise<void> {
    if (!this.isAuthenticated()) {
      await this.handleAuthError();
    }
  }
}

// 创建全局认证存储实例
export const authStore = new AuthStore();
