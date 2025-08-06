import { authStore } from '../stores/auth-store';
import { notificationService } from '../services/notification-service';
import { httpClient } from '../services/http-client';

/**
 * 现代化的管理后台页面组件
 */
export class AdminPage {
  private currentView: string = 'dashboard';
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById('admin-content')!;
    this.init();
  }

  /**
   * 初始化管理页面
   */
  private async init(): Promise<void> {
    try {
      // 确保用户有管理员权限
      await authStore.requireRole('admin');
      
      // 初始化路由
      this.initializeRouter();
      
      // 加载默认视图
      await this.loadView('dashboard');
      
    } catch (error) {
      console.error('Failed to initialize admin page:', error);
    }
  }

  /**
   * 初始化路由系统
   */
  private initializeRouter(): void {
    // 绑定导航事件
    document.querySelectorAll('.spa-nav[data-spa="admin-content"]').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const view = (e.currentTarget as HTMLElement).getAttribute('data-view')!;
        await this.loadView(view);
        this.updateActiveState(e.currentTarget as HTMLElement);
      });
    });

    // 处理浏览器前进后退
    window.addEventListener('popstate', (e) => {
      const view = e.state?.view || 'dashboard';
      this.loadView(view, false);
    });
  }

  /**
   * 加载视图
   */
  private async loadView(view: string, pushState = true): Promise<void> {
    try {
      this.showLoading();
      
      let content: string;
      
      switch (view) {
        case 'dashboard':
          content = await this.renderDashboard();
          break;
        case 'form-list':
          content = await this.renderFormList();
          break;
        case 'user-management':
          content = await this.renderUserManagement();
          break;
        default:
          content = await this.renderNotFound();
      }

      this.container.innerHTML = content;
      this.currentView = view;

      // 更新浏览器历史
      if (pushState) {
        window.history.pushState({ view }, '', `#${view}`);
      }

      // 绑定当前视图的事件
      await this.bindViewEvents(view);

    } catch (error) {
      console.error('Failed to load view:', error);
      this.container.innerHTML = this.renderError('加载页面失败，请稍后重试');
    }
  }

  /**
   * 显示加载状态
   */
  private showLoading(): void {
    this.container.innerHTML = `
      <div class="ea-loading">
        <svg class="ea-spinner" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="ml-2">加载中...</span>
      </div>
    `;
  }

  /**
   * 渲染仪表盘
   */
  private async renderDashboard(): Promise<string> {
    try {
      const response = await httpClient.get('/admin/dashboard/stats');
      const stats = response.data;

      return `
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
            <button onclick="location.reload()" class="ea-button-small">
              <i class="material-icons text-sm mr-1">refresh</i>
              刷新数据
            </button>
          </div>

          <!-- 统计卡片 -->
          <div class="ea-grid-4">
            <div class="ea-card">
              <div class="ea-card-body text-center">
                <div class="text-3xl font-bold text-blue-600 mb-2">
                  ${stats?.totalForms || 0}
                </div>
                <div class="text-gray-600">总表单数</div>
              </div>
            </div>
            <div class="ea-card">
              <div class="ea-card-body text-center">
                <div class="text-3xl font-bold text-green-600 mb-2">
                  ${stats?.completedForms || 0}
                </div>
                <div class="text-gray-600">已完成</div>
              </div>
            </div>
            <div class="ea-card">
              <div class="ea-card-body text-center">
                <div class="text-3xl font-bold text-yellow-600 mb-2">
                  ${stats?.pendingForms || 0}
                </div>
                <div class="text-gray-600">待处理</div>
              </div>
            </div>
            <div class="ea-card">
              <div class="ea-card-body text-center">
                <div class="text-3xl font-bold text-purple-600 mb-2">
                  ${stats?.totalUsers || 0}
                </div>
                <div class="text-gray-600">总用户数</div>
              </div>
            </div>
          </div>

          <!-- 最近活动 -->
          <div class="ea-card">
            <div class="ea-card-header">
              <h2 class="text-lg font-semibold">最近活动</h2>
            </div>
            <div class="ea-card-body">
              <div id="recent-activities">
                <div class="ea-loading">
                  <span>加载最近活动...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      return this.renderError('加载仪表盘数据失败');
    }
  }

  /**
   * 渲染表单列表
   */
  private async renderFormList(): Promise<string> {
    return `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900">表单管理</h1>
          <div class="flex gap-2">
            <button id="exportBtn" class="ea-button-small">
              <i class="material-icons text-sm mr-1">download</i>
              导出数据
            </button>
            <button id="refreshBtn" class="ea-button-small">
              <i class="material-icons text-sm mr-1">refresh</i>
              刷新
            </button>
          </div>
        </div>

        <!-- 搜索区域 -->
        <div class="ea-card">
          <div class="ea-card-body">
            <form id="searchForm" class="ea-form-row">
              <div class="ea-inline-field">
                <label class="ea-inline-label">邮箱</label>
                <input name="email" class="ea-input w-48" placeholder="搜索邮箱">
              </div>
              <div class="ea-inline-field">
                <label class="ea-inline-label">表单类型</label>
                <select name="form_type" class="ea-select">
                  <option value="">全部类型</option>
                  <option value="inspection">预约看房</option>
                  <option value="coverletter">求职信</option>
                  <option value="rentalApplication">租房申请</option>
                  <option value="airportPickup">接机服务</option>
                </select>
              </div>
              <div class="ea-inline-field">
                <label class="ea-inline-label">日期</label>
                <input name="date" type="date" class="ea-input w-40">
              </div>
              <button type="submit" class="ea-button-small">搜索</button>
              <button type="reset" class="ea-button-small bg-gray-600 hover:bg-gray-700">重置</button>
            </form>
          </div>
        </div>

        <!-- 表格区域 -->
        <div class="ea-card">
          <div class="ea-card-body p-0">
            <div class="overflow-x-auto">
              <table class="ea-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>用户邮箱</th>
                    <th>表单类型</th>
                    <th>创建时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody id="formDataTable">
                  <tr>
                    <td colspan="6" class="text-center py-8">
                      <div class="ea-loading">
                        <span>加载表单数据...</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 分页区域 -->
        <div id="pagination"></div>

        <!-- 统计信息 -->
        <div class="text-sm text-gray-500 text-center">
          共 <span id="totalCount">0</span> 条记录
        </div>
      </div>
    `;
  }

  /**
   * 渲染用户管理
   */
  private async renderUserManagement(): Promise<string> {
    return `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900">用户管理</h1>
          <button id="addUserBtn" class="ea-button-small">
            <i class="material-icons text-sm mr-1">person_add</i>
            添加用户
          </button>
        </div>

        <!-- 用户列表 -->
        <div class="ea-card">
          <div class="ea-card-body p-0">
            <div class="overflow-x-auto">
              <table class="ea-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>邮箱</th>
                    <th>角色</th>
                    <th>创建时间</th>
                    <th>最后登录</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody id="userDataTable">
                  <tr>
                    <td colspan="6" class="text-center py-8">
                      <div class="ea-loading">
                        <span>加载用户数据...</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染404页面
   */
  private async renderNotFound(): Promise<string> {
    return `
      <div class="ea-empty">
        <i class="material-icons ea-empty-icon">error_outline</i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">页面未找到</h3>
        <p class="text-gray-500 mb-4">请检查URL或返回仪表盘</p>
        <button onclick="window.adminPage.loadView('dashboard')" class="ea-button-small">
          返回仪表盘
        </button>
      </div>
    `;
  }

  /**
   * 渲染错误页面
   */
  private renderError(message: string): string {
    return `
      <div class="ea-empty">
        <i class="material-icons ea-empty-icon">error</i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">出错了</h3>
        <p class="text-gray-500 mb-4">${message}</p>
        <button onclick="location.reload()" class="ea-button-small">
          重新加载
        </button>
      </div>
    `;
  }

  /**
   * 绑定视图事件
   */
  private async bindViewEvents(view: string): Promise<void> {
    switch (view) {
      case 'dashboard':
        await this.bindDashboardEvents();
        break;
      case 'form-list':
        await this.bindFormListEvents();
        break;
      case 'user-management':
        await this.bindUserManagementEvents();
        break;
    }
  }

  /**
   * 绑定仪表盘事件
   */
  private async bindDashboardEvents(): Promise<void> {
    // 加载最近活动
    try {
      const response = await httpClient.get('/admin/activities/recent');
      const activities = response.data;
      
      const container = document.getElementById('recent-activities');
      if (container && activities) {
        container.innerHTML = activities.length > 0 
          ? activities.map((activity: any) => `
              <div class="flex items-center py-3 border-b border-gray-100 last:border-0">
                <div class="flex-1">
                  <p class="text-sm">${activity.description}</p>
                  <p class="text-xs text-gray-500">${new Date(activity.created_at).toLocaleString()}</p>
                </div>
              </div>
            `).join('')
          : '<div class="ea-empty"><span>暂无活动记录</span></div>';
      }
    } catch (error) {
      console.error('Failed to load recent activities:', error);
    }
  }

  /**
   * 绑定表单列表事件
   */
  private async bindFormListEvents(): Promise<void> {
    const { FormListManager } = await import('../components/form-list-manager');
    new FormListManager();
  }

  /**
   * 绑定用户管理事件
   */
  private async bindUserManagementEvents(): Promise<void> {
    const { UserManagementManager } = await import('../components/user-management-manager');
    new UserManagementManager();
  }

  /**
   * 更新导航激活状态
   */
  private updateActiveState(activeLink: HTMLElement): void {
    document.querySelectorAll('.spa-nav[data-spa="admin-content"]').forEach(link => {
      link.classList.remove('active');
    });
    activeLink.classList.add('active');
  }
}

// 将实例挂载到全局，供模板使用
(window as any).adminPage = null;

// 导出页面类
export default AdminPage;
