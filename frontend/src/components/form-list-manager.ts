import { httpClient } from '../services/http-client';
import { notificationService } from '../services/notification-service';
import { PaginationComponent } from './pagination';

interface FormData {
  id: number;
  email: string;
  form_type: string;
  created_gmt: string;
  status: string;
}

interface FormListResponse {
  results: FormData[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * 表单列表管理器
 */
export class FormListManager {
  private currentPage = 1;
  private pageSize = 10;
  private searchParams: Record<string, string> = {};
  private pagination?: PaginationComponent;

  constructor() {
    this.init();
  }

  /**
   * 初始化
   */
  private init(): void {
    this.bindEvents();
    this.loadFormData();
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    // 搜索表单
    const searchForm = document.getElementById('searchForm') as HTMLFormElement;
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSearch();
      });

      searchForm.addEventListener('reset', () => {
        setTimeout(() => {
          this.searchParams = {};
          this.currentPage = 1;
          this.loadFormData();
        }, 0);
      });
    }

    // 刷新按钮
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadFormData());
    }

    // 导出按钮
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExport());
    }
  }

  /**
   * 处理搜索
   */
  private handleSearch(): void {
    const searchForm = document.getElementById('searchForm') as HTMLFormElement;
    const formData = new FormData(searchForm);
    
    this.searchParams = {};
    for (const [key, value] of formData.entries()) {
      if (value && typeof value === 'string' && value.trim()) {
        this.searchParams[key] = value.trim();
      }
    }
    
    this.currentPage = 1;
    this.loadFormData();
  }

  /**
   * 加载表单数据
   */
  private async loadFormData(): Promise<void> {
    try {
      const params = {
        ...this.searchParams,
        page: this.currentPage,
        per_page: this.pageSize,
      };

      const response = await httpClient.get<FormListResponse>('/admin/forms', params);
      
      if (response.success && response.data) {
        this.renderTable(response.data.results);
        this.updatePagination(response.data);
        this.updateStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
      notificationService.error('加载表单数据失败，请稍后重试');
      this.renderTableError();
    }
  }

  /**
   * 渲染表格
   */
  private renderTable(forms: FormData[]): void {
    const tableBody = document.getElementById('formDataTable');
    if (!tableBody) return;

    if (forms.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8">
            <div class="ea-empty">
              <i class="material-icons ea-empty-icon">inbox</i>
              <span>暂无数据</span>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = forms.map(form => `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4 text-sm">${form.id}</td>
        <td class="px-6 py-4 text-sm">${form.email}</td>
        <td class="px-6 py-4 text-sm">${this.getFormTypeLabel(form.form_type)}</td>
        <td class="px-6 py-4 text-sm">${this.formatDate(form.created_gmt)}</td>
        <td class="px-6 py-4">
          <span class="ea-badge ${this.getStatusBadgeClass(form.status)}">
            ${this.getStatusLabel(form.status)}
          </span>
        </td>
        <td class="px-6 py-4">
          <div class="flex gap-2">
            <button 
              onclick="window.formListManager.viewDetail(${form.id})" 
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              查看详情
            </button>
            <button 
              onclick="window.formListManager.updateStatus(${form.id}, '${form.status === 'pending' ? 'completed' : 'pending'}')" 
              class="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              ${form.status === 'pending' ? '标记完成' : '标记待处理'}
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  /**
   * 渲染表格错误状态
   */
  private renderTableError(): void {
    const tableBody = document.getElementById('formDataTable');
    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8">
          <div class="ea-empty">
            <i class="material-icons ea-empty-icon">error</i>
            <span>加载失败，请稍后重试</span>
            <button onclick="window.formListManager.loadFormData()" class="ea-button-small mt-2">
              重新加载
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * 更新分页
   */
  private updatePagination(data: FormListResponse): void {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    if (this.pagination) {
      this.pagination.update({
        currentPage: data.page,
        totalPages: data.total_pages,
        totalItems: data.total,
        pageSize: data.per_page,
      });
    } else {
      this.pagination = new PaginationComponent(
        paginationContainer,
        {
          currentPage: data.page,
          totalPages: data.total_pages,
          totalItems: data.total,
          pageSize: data.per_page,
          showInfo: true,
          showSizeChanger: true,
        },
        {
          onPageChange: (page) => {
            this.currentPage = page;
            this.loadFormData();
          },
          onPageSizeChange: (pageSize) => {
            this.pageSize = pageSize;
            this.currentPage = 1;
            this.loadFormData();
          },
        }
      );
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(data: FormListResponse): void {
    const totalCountSpan = document.getElementById('totalCount');
    if (totalCountSpan) {
      totalCountSpan.textContent = data.total.toString();
    }
  }

  /**
   * 查看详情
   */
  async viewDetail(id: number): Promise<void> {
    try {
      const loadingId = notificationService.loading('获取详情中...');
      
      const response = await httpClient.get(`/admin/forms/${id}`);
      
      notificationService.finishLoading(loadingId, 'success', '获取成功');
      
      if (response.success && response.data) {
        this.showDetailModal(response.data);
      }
    } catch (error) {
      console.error('Failed to get form detail:', error);
      notificationService.error('获取详情失败，请稍后重试');
    }
  }

  /**
   * 更新状态
   */
  async updateStatus(id: number, status: string): Promise<void> {
    try {
      const loadingId = notificationService.loading('更新状态中...');
      
      const response = await httpClient.patch(`/admin/forms/${id}`, { status });
      
      if (response.success) {
        notificationService.finishLoading(loadingId, 'success', '状态更新成功');
        this.loadFormData(); // 重新加载数据
      } else {
        notificationService.finishLoading(loadingId, 'error', '状态更新失败');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      notificationService.error('状态更新失败，请稍后重试');
    }
  }

  /**
   * 显示详情弹窗
   */
  private showDetailModal(detail: any): void {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b">
          <h3 class="text-lg font-semibold">表单详情 #${detail.id}</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="material-icons">close</i>
          </button>
        </div>
        <div class="p-6">
          <pre class="bg-gray-50 p-4 rounded text-sm overflow-x-auto">${JSON.stringify(detail, null, 2)}</pre>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * 处理导出
   */
  private async handleExport(): Promise<void> {
    try {
      const loadingId = notificationService.loading('准备导出数据...');
      
      const params = {
        ...this.searchParams,
        export: 'csv',
      };

      const response = await httpClient.get('/admin/forms/export', params);
      
      if (response.success) {
        notificationService.finishLoading(loadingId, 'success', '导出成功');
        // 这里可以处理文件下载
        notificationService.info('导出功能开发中...');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      notificationService.error('导出失败，请稍后重试');
    }
  }

  /**
   * 工具方法
   */
  private getFormTypeLabel(type: string): string {
    const types: Record<string, string> = {
      inspection: '预约看房',
      coverletter: '求职信',
      rentalApplication: '租房申请',
      airportPickup: '接机服务',
    };
    return types[type] || type;
  }

  private getStatusLabel(status: string): string {
    const statuses: Record<string, string> = {
      pending: '待处理',
      completed: '已完成',
      cancelled: '已取消',
    };
    return statuses[status] || status;
  }

  private getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'ea-badge-warning',
      completed: 'ea-badge-success',
      cancelled: 'ea-badge-error',
    };
    return classes[status] || 'ea-badge-info';
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

// 挂载到全局
(window as any).formListManager = null;
