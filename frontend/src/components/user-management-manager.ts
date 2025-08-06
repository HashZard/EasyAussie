import { httpClient } from '../services/http-client';
import { notificationService } from '../services/notification-service';
import { FormComponent } from './form';

interface UserData {
  id: number;
  email: string;
  roles: string[];
  created_at: string;
  last_login_at?: string;
}

/**
 * 用户管理器
 */
export class UserManagementManager {
  private users: UserData[] = [];

  constructor() {
    this.init();
  }

  /**
   * 初始化
   */
  private init(): void {
    this.bindEvents();
    this.loadUsers();
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => this.showAddUserModal());
    }
  }

  /**
   * 加载用户数据
   */
  private async loadUsers(): Promise<void> {
    try {
      const response = await httpClient.get<UserData[]>('/admin/users');
      
      if (response.success && response.data) {
        this.users = response.data;
        this.renderUserTable();
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      notificationService.error('加载用户数据失败，请稍后重试');
      this.renderTableError();
    }
  }

  /**
   * 渲染用户表格
   */
  private renderUserTable(): void {
    const tableBody = document.getElementById('userDataTable');
    if (!tableBody) return;

    if (this.users.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8">
            <div class="ea-empty">
              <i class="material-icons ea-empty-icon">people</i>
              <span>暂无用户数据</span>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = this.users.map(user => `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4 text-sm">${user.id}</td>
        <td class="px-6 py-4 text-sm font-medium">${user.email}</td>
        <td class="px-6 py-4">
          <div class="flex flex-wrap gap-1">
            ${user.roles.map(role => `
              <span class="ea-badge ${this.getRoleBadgeClass(role)}">
                ${this.getRoleLabel(role)}
              </span>
            `).join('')}
          </div>
        </td>
        <td class="px-6 py-4 text-sm">${this.formatDate(user.created_at)}</td>
        <td class="px-6 py-4 text-sm">${this.formatDate(user.last_login_at)}</td>
        <td class="px-6 py-4">
          <div class="flex gap-2">
            <button 
              onclick="window.userManager.editUser(${user.id})" 
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              编辑
            </button>
            <button 
              onclick="window.userManager.deleteUser(${user.id})" 
              class="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              删除
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
    const tableBody = document.getElementById('userDataTable');
    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8">
          <div class="ea-empty">
            <i class="material-icons ea-empty-icon">error</i>
            <span>加载失败，请稍后重试</span>
            <button onclick="window.userManager.loadUsers()" class="ea-button-small mt-2">
              重新加载
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * 显示添加用户弹窗
   */
  private showAddUserModal(): void {
    this.showUserModal('添加用户', null);
  }

  /**
   * 编辑用户
   */
  async editUser(id: number): Promise<void> {
    try {
      const response = await httpClient.get(`/admin/users/${id}`);
      
      if (response.success && response.data) {
        this.showUserModal('编辑用户', response.data);
      }
    } catch (error) {
      console.error('Failed to get user data:', error);
      notificationService.error('获取用户数据失败');
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(id: number): Promise<void> {
    const user = this.users.find(u => u.id === id);
    if (!user) return;

    const confirmed = confirm(`确认删除用户 ${user.email} 吗？此操作不可撤销。`);
    if (!confirmed) return;

    try {
      const loadingId = notificationService.loading('删除中...');
      
      const response = await httpClient.delete(`/admin/users/${id}`);
      
      if (response.success) {
        notificationService.finishLoading(loadingId, 'success', '删除成功');
        this.loadUsers(); // 重新加载列表
      } else {
        notificationService.finishLoading(loadingId, 'error', '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      notificationService.error('删除失败，请稍后重试');
    }
  }

  /**
   * 显示用户弹窗
   */
  private showUserModal(title: string, userData: UserData | null): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-md w-full mx-4">
        <div class="flex items-center justify-between p-6 border-b">
          <h3 class="text-lg font-semibold">${title}</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="material-icons">close</i>
          </button>
        </div>
        <div class="p-6">
          <div id="userFormContainer"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);

    // 创建表单
    const formContainer = modal.querySelector('#userFormContainer') as HTMLElement;
    const form = new FormComponent(formContainer, {
      fields: [
        {
          name: 'email',
          type: 'email',
          label: '邮箱地址',
          required: true,
          placeholder: '请输入邮箱地址',
        },
        {
          name: 'roles',
          type: 'checkbox',
          label: '用户角色',
          required: true,
          options: [
            { value: 'user', label: '普通用户' },
            { value: 'admin', label: '管理员' },
          ],
        },
        ...(userData ? [] : [
          {
            name: 'password',
            type: 'password' as const,
            label: '密码',
            required: true,
            placeholder: '请输入密码',
            validation: {
              minLength: 6,
            },
          },
        ]),
      ],
      submitButtonText: userData ? '更新用户' : '添加用户',
      resetAfterSubmit: false,
      onSubmit: async (formData) => {
        const url = userData ? `/admin/users/${userData.id}` : '/admin/users';
        const method = userData ? 'PUT' : 'POST';
        
        const response = await httpClient.request({
          url,
          method: method as any,
          data: formData,
        });

        if (response.success) {
          modal.remove();
          this.loadUsers();
          return response.data;
        } else {
          throw new Error(response.message || '操作失败');
        }
      },
    });

    // 如果是编辑模式，填充数据
    if (userData) {
      form.setFieldValue('email', userData.email);
      userData.roles.forEach(role => {
        const checkbox = formContainer.querySelector(`input[value="${role}"]`) as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    }

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * 工具方法
   */
  private getRoleLabel(role: string): string {
    const roles: Record<string, string> = {
      user: '用户',
      admin: '管理员',
    };
    return roles[role] || role;
  }

  private getRoleBadgeClass(role: string): string {
    const classes: Record<string, string> = {
      user: 'ea-badge-info',
      admin: 'ea-badge-error',
    };
    return classes[role] || 'ea-badge-info';
  }

  private formatDate(dateString?: string): string {
    if (!dateString) return '从未';
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
(window as any).userManager = null;
