export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface NotificationOptions {
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number;
  closable?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
}

export interface Notification extends NotificationOptions {
  id: string;
  timestamp: number;
}

/**
 * 现代化通知系统
 * 替代传统的 alert()，提供更好的用户体验
 */
export class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private container: HTMLElement | null = null;
  private subscribers: Set<(notifications: Notification[]) => void> = new Set();

  constructor() {
    this.initializeContainer();
  }

  /**
   * 初始化通知容器
   */
  private initializeContainer(): void {
    if (document.getElementById('notification-container')) {
      return;
    }

    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = 'fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none';
    this.container.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
      max-width: 400px;
    `;
    
    document.body.appendChild(this.container);
  }

  /**
   * 订阅通知变化
   */
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.subscribers.add(callback);
    callback(Array.from(this.notifications.values()));
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * 通知订阅者
   */
  private notify(): void {
    const notifications = Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp - a.timestamp);
    this.subscribers.forEach(callback => callback(notifications));
  }

  /**
   * 显示通知
   */
  show(options: Omit<NotificationOptions, 'type'> & { type: NotificationType }): string {
    const id = this.generateId();
    const notification: Notification = {
      id,
      timestamp: Date.now(),
      duration: options.duration ?? (options.type === 'loading' ? 0 : 5000),
      closable: options.closable ?? true,
      ...options,
    };

    this.notifications.set(id, notification);
    this.renderNotification(notification);
    this.notify();

    // 自动移除（如果设置了持续时间）
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration);
    }

    return id;
  }

  /**
   * 成功通知
   */
  success(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      ...options,
      message,
      type: 'success',
    });
  }

  /**
   * 错误通知
   */
  error(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      ...options,
      message,
      type: 'error',
      duration: options?.duration ?? 3000, // 错误通知8秒后自动消失
    });
  }

  /**
   * 警告通知
   */
  warning(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      ...options,
      message,
      type: 'warning',
    });
  }

  /**
   * 信息通知
   */
  info(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      ...options,
      message,
      type: 'info',
    });
  }

  /**
   * 加载通知
   */
  loading(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      ...options,
      message,
      type: 'loading',
      closable: false,
      duration: 0,
    });
  }

  /**
   * 移除通知
   */
  remove(id: string): void {
    const notification = this.notifications.get(id);
    if (!notification) return;

    this.notifications.delete(id);
    
    const element = document.getElementById(`notification-${id}`);
    if (element) {
      // 清理全局函数
      const buttons = element.querySelectorAll('button[onclick^="window.action_"]');
      buttons.forEach(button => {
        const onclick = button.getAttribute('onclick');
        if (onclick) {
          const match = onclick.match(/window\.(action_[^(]+)\(/);
          if (match) {
            delete (window as any)[match[1]];
          }
        }
      });
      
      element.style.animation = 'slideOutRight 0.3s ease-in-out forwards';
      setTimeout(() => {
        element.remove();
      }, 300);
    }

    this.notify();
  }

  /**
   * 清除所有通知
   */
  clear(): void {
    // 清理所有全局函数
    if (this.container) {
      const buttons = this.container.querySelectorAll('button[onclick^="window.action_"]');
      buttons.forEach(button => {
        const onclick = button.getAttribute('onclick');
        if (onclick) {
          const match = onclick.match(/window\.(action_[^(]+)\(/);
          if (match) {
            delete (window as any)[match[1]];
          }
        }
      });
      this.container.innerHTML = '';
    }
    
    this.notifications.clear();
    this.notify();
  }

  /**
   * 更新加载通知
   */
  updateLoading(id: string, message: string): void {
    const notification = this.notifications.get(id);
    if (notification && notification.type === 'loading') {
      notification.message = message;
      this.renderNotification(notification);
    }
  }

  /**
   * 完成加载通知
   */
  finishLoading(id: string, type: 'success' | 'error' = 'success', message?: string): void {
    const notification = this.notifications.get(id);
    if (notification && notification.type === 'loading') {
      notification.type = type;
      notification.closable = true;
      notification.duration = 3000;
      
      if (message) {
        notification.message = message;
      }
      
      this.renderNotification(notification);
      
      // 自动移除
      setTimeout(() => {
        this.remove(id);
      }, notification.duration);
    }
  }

  /**
   * 渲染通知
   */
  private renderNotification(notification: Notification): void {
    if (!this.container) return;

    const existingElement = document.getElementById(`notification-${notification.id}`);
    if (existingElement) {
      existingElement.remove();
    }

    const element = document.createElement('div');
    element.id = `notification-${notification.id}`;
    element.className = 'pointer-events-auto';
    
    const styles = this.getNotificationStyles(notification.type);
    const icon = this.getNotificationIcon(notification.type);

    element.innerHTML = `
      <div class="flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm animate-slideInRight ${styles}">
        <div class="flex-shrink-0">
          ${icon}
        </div>
        <div class="flex-1 min-w-0">
          ${notification.title ? `<h4 class="font-medium text-sm mb-1">${notification.title}</h4>` : ''}
          <p class="text-sm opacity-90">${notification.message}</p>
          ${notification.actions ? this.renderActions(notification.actions) : ''}
        </div>
        ${notification.closable ? `
          <button 
            onclick="window.notificationService.remove('${notification.id}')"
            class="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        ` : ''}
      </div>
    `;

    this.container.appendChild(element);
  }

  /**
   * 获取通知样式
   */
  private getNotificationStyles(type: NotificationType): string {
    const styles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      loading: 'bg-blue-50 border-blue-200 text-blue-800',
    };
    return styles[type];
  }

  /**
   * 获取通知图标
   */
  private getNotificationIcon(type: NotificationType): string {
    const icons = {
      success: `
        <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
      `,
      error: `
        <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
      `,
      warning: `
        <svg class="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
      `,
      info: `
        <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
        </svg>
      `,
      loading: `
        <svg class="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      `,
    };
    return icons[type];
  }

  /**
   * 渲染操作按钮
   */
  private renderActions(actions: NotificationOptions['actions']): string {
    if (!actions || actions.length === 0) return '';

    return `
      <div class="flex gap-2 mt-2">
        ${actions.map((action, index) => {
          const actionId = `action_${Date.now()}_${index}`;
          // 将函数存储到全局对象中，以便在HTML中调用
          (window as any)[actionId] = action.action;
          
          return `
            <button
              onclick="window.${actionId}()"
              class="px-3 py-1 text-xs rounded-md transition-colors ${
                action.primary 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'border border-gray-400 text-gray-700 hover:bg-gray-100'
              }"
            >
              ${action.label}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .animate-slideInRight {
    animation: slideInRight 0.3s ease-out forwards;
  }
`;
document.head.appendChild(style);

// 创建全局通知服务实例
export const notificationService = new NotificationService();

// 挂载到 window 对象以便在模板中使用
(window as any).notificationService = notificationService;
