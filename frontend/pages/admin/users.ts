/**
 * 用户管理页面内容 - TypeScript版本
 */

import { httpClient } from '../../src/services/http-client';

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    wechat_nickname?: string;
    avatar?: string;
    role: 'admin' | 'paid1' | 'paid2' | 'user';
    status: 'active' | 'disabled';
    createdAt: string;
    lastLogin?: string;
    roles?: string[]; // 后端返回的角色数组
}

export interface UserFilters {
    email: string;
    name: string;
    phone: string;
    wechat: string;
    status: 'all' | 'active' | 'disabled';
    role: 'all' | 'admin' | 'paid1' | 'paid2' | 'user';
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}

/**
 * 获取用户列表数据
 */
export async function getUsersList(filters: UserFilters, page: number = 1): Promise<{ users: User[], pagination: PaginationInfo }> {
    try {
        // 构建查询参数
        const queryParams = new URLSearchParams();
        if (filters.email) queryParams.append('email', filters.email);
        if (filters.name) queryParams.append('name', filters.name);
        if (filters.phone) queryParams.append('phone', filters.phone);
        if (filters.wechat) queryParams.append('wechat', filters.wechat);
        
        const url = `/admin/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        console.log('Fetching users from:', url); // 添加调试日志
        
        const response = await httpClient.get<any>(url);
        console.log('User list response:', response); // 添加调试日志
        
        if (response.success && response.data && response.data.users) {
            let users = response.data.users.map((user: any) => ({
                id: user.id?.toString() || '',
                email: user.email || '',
                name: user.name || '',
                phone: user.phone || '',
                wechat_nickname: user.wechat_nickname || '',
                avatar: user.avatar || '',
                role: (user.roles && user.roles.length > 0 ? user.roles[0] : 'user') as User['role'],
                status: user.active ? 'active' as const : 'disabled' as const,
                createdAt: user.created_at || new Date().toISOString(),
                lastLogin: user.last_login_at || undefined,
                roles: user.roles || []
            }));
            
            // 前端筛选逻辑（针对状态/角色筛选）
            if (filters.status !== 'all') {
                users = users.filter((user: User) => user.status === filters.status);
            }
            
            if (filters.role !== 'all') {
                users = users.filter((user: User) => user.role === filters.role);
            }
            
            // 分页处理
            const itemsPerPage = 10;
            const totalItems = users.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedUsers = users.slice(startIndex, endIndex);
            
            return {
                users: paginatedUsers,
                pagination: {
                    currentPage: page,
                    totalPages: Math.max(totalPages, 1),
                    totalItems,
                    itemsPerPage
                }
            };
        }
        
        return {
            users: [],
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 10
            }
        };
        
    } catch (error) {
        console.error('Error fetching users list:', error);
        return {
            users: [],
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 10
            }
        };
    }
}

/**
 * 切换用户状态
 */
export async function toggleUserStatus(email: string, active: boolean): Promise<boolean> {
    try {
        const response = await httpClient.post<any>('/admin/toggle-user', {
            email,
            active
        });
        
        if (response.success && response.data) {
            const backendResponse = response.data;
            return backendResponse.success;
        }
        
        return false;
    } catch (error) {
        console.error('Error toggling user status:', error);
        return false;
    }
}

/**
 * 分配角色给用户
 */
export async function assignRoleToUser(email: string, role: string): Promise<boolean> {
    try {
        const response = await httpClient.post<any>('/admin/assign-role', {
            email,
            role
        });
        
        if (response.success && response.data) {
            const backendResponse = response.data;
            return backendResponse.success;
        }
        
        return false;
    } catch (error) {
        console.error('Error assigning role to user:', error);
        return false;
    }
}

/**
 * 移除用户角色
 */
export async function removeRoleFromUser(email: string, role: string): Promise<boolean> {
    try {
        const response = await httpClient.post<any>('/admin/remove-role', {
            email,
            role
        });
        
        if (response.success && response.data) {
            const backendResponse = response.data;
            return backendResponse.success;
        }
        
        return false;
    } catch (error) {
        console.error('Error removing role from user:', error);
        return false;
    }
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(email: string, newPassword: string): Promise<boolean> {
    try {
        const response = await httpClient.post<any>('/admin/reset-password', {
            email,
            new_password: newPassword
        });
        
        if (response.success && response.data) {
            const backendResponse = response.data;
            return backendResponse.success;
        }
        
        return false;
    } catch (error) {
        console.error('Error resetting user password:', error);
        return false;
    }
}

/**
 * 获取角色显示名称
 */
export function getRoleDisplayName(role: User['role']): string {
    const roleMap: Record<User['role'], string> = {
        'admin': '管理员',
        'paid1': 'VIP用户',
        'paid2': '高级用户',
        'user': '普通用户'
    };
    return roleMap[role];
}

/**
 * 获取状态显示名称和样式
 */
export function getStatusDisplay(status: User['status']): { label: string; className: string } {
    const statusMap = {
        'active': { label: '活跃', className: 'status-badge status-success' },
        'disabled': { label: '禁用', className: 'status-badge status-error' }
    };
    return statusMap[status];
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 生成桌面端用户表格HTML
 */
function generateDesktopUserTable(users: User[]): string {
    return `
        <div class="hidden lg:block overflow-x-auto">
            <table class="responsive-table">
                <thead>
                    <tr>
                        <th>用户信息</th>
                        <th>联系方式</th>
                        <th>角色</th>
                        <th>状态</th>
                        <th>注册时间</th>
                        <th>最后登录</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>
                                <div class="flex items-center">
                                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                                        ${user.name ? user.name.charAt(0) : user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div class="text-sm font-medium text-gray-900">${user.name || '未设置'}</div>
                                        <div class="text-sm text-gray-500">${user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="space-y-1">
                                    ${user.phone ? `<div class="text-xs text-gray-600"><i class="fas fa-phone mr-1"></i>${user.phone}</div>` : ''}
                                    ${user.wechat_nickname ? `<div class="text-xs text-gray-600"><i class="fab fa-weixin mr-1"></i>${user.wechat_nickname}</div>` : ''}
                                    ${!user.phone && !user.wechat_nickname ? '<span class="text-xs text-gray-400">未填写</span>' : ''}
                                </div>
                            </td>
                            <td>
                                <span class="status-badge status-info">${getRoleDisplayName(user.role)}</span>
                            </td>
                            <td>
                                <span class="${getStatusDisplay(user.status).className}">${getStatusDisplay(user.status).label}</span>
                            </td>
                            <td class="text-sm text-gray-900">${formatDate(user.createdAt)}</td>
                            <td class="text-sm text-gray-900">${user.lastLogin ? formatDate(user.lastLogin) : '从未登录'}</td>
                            <td>
                                <div class="flex items-center space-x-2">
                                    <button class="btn btn-sm btn-secondary" data-action="edit" data-user-id="${user.id}" title="编辑用户">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm ${user.status === 'active' ? 'btn-warning' : 'btn-success'}" 
                                            data-action="toggle-status" data-user-id="${user.id}"
                                            title="${user.status === 'active' ? '禁用用户' : '启用用户'}">
                                        <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" data-action="delete" data-user-id="${user.id}" title="删除用户">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * 生成移动端用户列表HTML
 */
function generateMobileUserList(users: User[]): string {
    return `
        <div class="lg:hidden mobile-table">
            ${users.map(user => `
                <div class="mobile-table-row">
                    <div class="flex items-center mb-3">
                        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                            ${user.name ? user.name.charAt(0) : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div class="flex-1">
                            <div class="font-medium text-gray-900">${user.name || '未设置'}</div>
                            <div class="text-sm text-gray-500">${user.email}</div>
                        </div>
                    </div>
                    
                    <div class="mobile-table-cell">
                        <span class="mobile-table-label">联系方式</span>
                        <div class="mobile-table-value space-y-1">
                            ${user.phone ? `<div class="text-xs text-gray-600"><i class="fas fa-phone mr-1"></i>${user.phone}</div>` : ''}
                            ${user.wechat_nickname ? `<div class="text-xs text-gray-600"><i class="fab fa-weixin mr-1"></i>${user.wechat_nickname}</div>` : ''}
                            ${!user.phone && !user.wechat_nickname ? '<span class="text-xs text-gray-400">未填写</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="mobile-table-cell">
                        <span class="mobile-table-label">角色</span>
                        <span class="status-badge status-info">${getRoleDisplayName(user.role)}</span>
                    </div>
                    
                    <div class="mobile-table-cell">
                        <span class="mobile-table-label">状态</span>
                        <span class="${getStatusDisplay(user.status).className}">${getStatusDisplay(user.status).label}</span>
                    </div>
                    
                    <div class="mobile-table-cell">
                        <span class="mobile-table-label">注册时间</span>
                        <span class="mobile-table-value">${formatDate(user.createdAt)}</span>
                    </div>
                    
                    <div class="mobile-table-cell">
                        <span class="mobile-table-label">最后登录</span>
                        <span class="mobile-table-value">${user.lastLogin ? formatDate(user.lastLogin) : '从未登录'}</span>
                    </div>
                    
                    <div class="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-200">
                        <button class="btn btn-sm btn-secondary" data-action="edit" data-user-id="${user.id}">编辑</button>
                        <button class="btn btn-sm ${user.status === 'active' ? 'btn-warning' : 'btn-success'}" 
                                data-action="toggle-status" data-user-id="${user.id}">
                            ${user.status === 'active' ? '禁用' : '启用'}
                        </button>
                        <button class="btn btn-sm btn-danger" data-action="delete" data-user-id="${user.id}">删除</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * 获取用户管理页面内容
 */
export async function getUsersPageContent(): Promise<string> {
    const defaultFilters: UserFilters = { 
        email: '', 
        name: '', 
        phone: '', 
        wechat: '', 
        status: 'all', 
        role: 'all' 
    };
    const { users, pagination } = await getUsersList(defaultFilters, 1);

    return `
        <div class="space-y-4 lg:space-y-6 fade-in">
            <!-- 页面标题和操作 -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-lg lg:text-xl font-semibold text-gray-900">用户管理</h1>
                    <p class="text-sm text-gray-600">管理系统中的所有用户</p>
                </div>
                <button class="btn btn-primary" id="add-user-btn">
                    <i class="fas fa-user-plus mr-2"></i>
                    添加用户
                </button>
            </div>

            <!-- 搜索和筛选 -->
            <div class="card">
                <div class="card-body">
                    <!-- 精确查询条件 -->
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <label class="block text-sm font-medium text-gray-700">查询条件</label>
                            <button type="button" id="clear-filters-btn" class="text-sm text-blue-600 hover:text-blue-800">
                                <i class="fas fa-eraser mr-1"></i>清空条件
                            </button>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                                <input type="email" 
                                       id="email-filter"
                                       placeholder="输入邮箱..."
                                       class="form-input text-sm">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                                <input type="text" 
                                       id="name-filter"
                                       placeholder="输入姓名..."
                                       class="form-input text-sm">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">电话</label>
                                <input type="text" 
                                       id="phone-filter"
                                       placeholder="输入电话..."
                                       class="form-input text-sm">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">微信昵称</label>
                                <input type="text" 
                                       id="wechat-filter"
                                       placeholder="输入微信昵称..."
                                       class="form-input text-sm">
                            </div>
                        </div>
                        
                        <div class="flex flex-col sm:flex-row gap-4 items-end">
                            <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">状态筛选</label>
                                    <select id="status-filter" class="form-select text-sm">
                                        <option value="all">所有状态</option>
                                        <option value="active">活跃</option>
                                        <option value="disabled">禁用</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">角色筛选</label>
                                    <select id="role-filter" class="form-select text-sm">
                                        <option value="all">所有角色</option>
                                        <option value="admin">管理员</option>
                                        <option value="paid1">VIP用户</option>
                                        <option value="paid2">高级用户</option>
                                        <option value="user">普通用户</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="flex gap-2">
                                <button type="button" id="search-btn" class="btn btn-primary">
                                    <i class="fas fa-search mr-2"></i>搜索
                                </button>
                                <button type="button" id="refresh-btn" class="btn btn-secondary">
                                    <i class="fas fa-sync-alt mr-2"></i>刷新
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 用户列表 -->
            <div class="card">
                <div class="card-header">
                    <h2 class="text-lg font-medium text-gray-900">用户列表</h2>
                    <p class="text-sm text-gray-500 mt-1">共 ${pagination.totalItems} 个用户</p>
                </div>
                <div class="card-body p-0">
                    <div id="users-table-container">
                        ${generateDesktopUserTable(users)}
                        ${generateMobileUserList(users)}
                    </div>
                </div>
            </div>

            <!-- 分页 -->
            <div class="flex items-center justify-between" id="pagination-container">
                <div class="text-sm text-gray-700">
                    显示第 ${(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} 项，共 ${pagination.totalItems} 项
                </div>
                <div class="flex items-center space-x-2">
                    <button class="btn btn-sm btn-secondary" ${pagination.currentPage === 1 ? 'disabled' : ''} data-page="${pagination.currentPage - 1}">
                        上一页
                    </button>
                    <span class="px-3 py-1 text-sm text-gray-600">第 ${pagination.currentPage} / ${pagination.totalPages} 页</span>
                    <button class="btn btn-sm btn-secondary" ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''} data-page="${pagination.currentPage + 1}">
                        下一页
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * 初始化用户管理页面
 */
export async function initializeUsersPage(): Promise<void> {
    try {
        // 设置筛选功能
        setupFilters();
        
        // 设置用户操作事件
        setupUserActions();
        
        // 设置分页功能
        setupPagination();
        
        // 设置新的按钮事件
        setupSearchButtons();
        
        console.log('Users page initialized with TypeScript');
    } catch (error) {
        console.error('Error initializing users page:', error);
    }
}

/**
 * 设置筛选功能
 */
function setupFilters(): void {
    const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
    const roleFilter = document.getElementById('role-filter') as HTMLSelectElement;
    const emailInput = document.getElementById('email-filter') as HTMLInputElement;
    const nameInput = document.getElementById('name-filter') as HTMLInputElement;
    const phoneInput = document.getElementById('phone-filter') as HTMLInputElement;
    const wechatInput = document.getElementById('wechat-filter') as HTMLInputElement;
    
    // 为所有筛选器添加事件监听
    [statusFilter, roleFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', async () => {
                await refreshUsersList(1);
            });
        }
    });
    
    // 为输入框添加延迟搜索
    [emailInput, nameInput, phoneInput, wechatInput].forEach(input => {
        if (input) {
            let timeout: NodeJS.Timeout;
            input.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(async () => {
                    await refreshUsersList(1);
                }, 500);
            });
        }
    });
}

/**
 * 设置用户操作事件
 */
function setupUserActions(): void {
    const tableContainer = document.getElementById('users-table-container');
    if (tableContainer) {
        tableContainer.addEventListener('click', handleUserAction);
    }
    
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', handleAddUser);
    }
}

/**
 * 设置分页功能
 */
function setupPagination(): void {
    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) {
        paginationContainer.addEventListener('click', handlePaginationClick);
    }
}

/**
 * 设置搜索相关按钮
 */
function setupSearchButtons(): void {
    const searchBtn = document.getElementById('search-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', handleClearFilters);
    }
}

/**
 * 处理搜索
 */
async function handleSearch(): Promise<void> {
    await refreshUsersList(1);
}

/**
 * 处理刷新
 */
async function handleRefresh(): Promise<void> {
    await refreshUsersList(getCurrentPage());
}

/**
 * 处理清空筛选条件
 */
async function handleClearFilters(): Promise<void> {
    // 清空所有输入框
    const emailInput = document.getElementById('email-filter') as HTMLInputElement;
    const nameInput = document.getElementById('name-filter') as HTMLInputElement;
    const phoneInput = document.getElementById('phone-filter') as HTMLInputElement;
    const wechatInput = document.getElementById('wechat-filter') as HTMLInputElement;
    const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
    const roleFilter = document.getElementById('role-filter') as HTMLSelectElement;
    
    if (emailInput) emailInput.value = '';
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (wechatInput) wechatInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    if (roleFilter) roleFilter.value = 'all';
    
    // 刷新列表
    await refreshUsersList(1);
}

/**
 * 获取当前页码
 */
function getCurrentPage(): number {
    // 从分页容器中获取当前页码，默认为1
    return 1;
}

/**
 * 处理用户操作
 */
async function handleUserAction(event: Event): Promise<void> {
    const target = event.target as HTMLElement;
    const button = target.closest('[data-action]') as HTMLElement;
    
    if (button) {
        const action = button.dataset.action;
        const userId = button.dataset.userId;
        
        switch (action) {
            case 'edit':
                await handleEditUser(userId!);
                break;
            case 'toggle-status':
                await handleToggleUserStatus(userId!);
                break;
            case 'delete':
                await handleDeleteUser(userId!);
                break;
        }
    }
}

/**
 * 显示编辑用户模态框
 */
function showEditUserModal(user: User): void {
    const modal = createEditUserModal(user);
    document.body.appendChild(modal);
    
    // 显示模态框
    modal.style.display = 'flex';
    
    // 设置事件监听器
    setupEditUserModal(modal, user);
}

/**
 * 创建编辑用户模态框
 */
function createEditUserModal(user: User): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'edit-user-modal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">编辑用户</h3>
                <button type="button" class="text-gray-400 hover:text-gray-600" id="close-modal-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <!-- 用户基本信息 -->
                <div class="border-b border-gray-200 pb-4">
                    <h4 class="font-medium text-gray-900 mb-2">基本信息</h4>
                    <div class="space-y-3 text-sm">
                        <div>
                            <span class="text-gray-500">邮箱:</span>
                            <span class="ml-2 font-medium">${user.email}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">姓名:</span>
                            <span class="ml-2">${user.name || '未设置'}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">电话:</span>
                            <span class="ml-2">${user.phone || '未设置'}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">微信昵称:</span>
                            <span class="ml-2">${user.wechat_nickname || '未设置'}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">当前状态:</span>
                            <span class="ml-2">
                                <span class="${getStatusDisplay(user.status).className}">${getStatusDisplay(user.status).label}</span>
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- 角色管理 -->
                <div class="border-b border-gray-200 pb-4">
                    <h4 class="font-medium text-gray-900 mb-3">角色管理</h4>
                    <div class="space-y-3">
                        <div>
                            <label class="form-label">当前角色</label>
                            <select id="user-role-select" class="form-select">
                                <option value="user" ${user.role === 'user' ? 'selected' : ''}>普通用户</option>
                                <option value="paid1" ${user.role === 'paid1' ? 'selected' : ''}>VIP用户</option>
                                <option value="paid2" ${user.role === 'paid2' ? 'selected' : ''}>高级用户</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>管理员</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- 密码重置 -->
                <div class="border-b border-gray-200 pb-4">
                    <h4 class="font-medium text-gray-900 mb-3">密码管理</h4>
                    <div class="space-y-3">
                        <div>
                            <label class="form-label">新密码</label>
                            <input type="password" id="new-password" class="form-input" placeholder="留空则不修改密码">
                            <small class="text-gray-500 text-xs mt-1">最少6位字符</small>
                        </div>
                    </div>
                </div>
                
                <!-- 操作按钮 -->
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" class="btn btn-secondary" id="cancel-btn">取消</button>
                    <button type="button" class="btn btn-primary" id="save-user-btn">
                        <i class="fas fa-save mr-2"></i>
                        保存更改
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

/**
 * 设置编辑用户模态框事件
 */
function setupEditUserModal(modal: HTMLElement, user: User): void {
    const closeBtn = modal.querySelector('#close-modal-btn') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement;
    const saveBtn = modal.querySelector('#save-user-btn') as HTMLButtonElement;
    
    // 关闭模态框函数
    const closeModal = () => {
        modal.remove();
    };
    
    // 关闭按钮事件
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // 保存按钮事件
    saveBtn?.addEventListener('click', async () => {
        await handleSaveUserChanges(modal, user, closeModal);
    });
}

/**
 * 处理保存用户更改
 */
async function handleSaveUserChanges(modal: HTMLElement, user: User, closeModal: () => void): Promise<void> {
    try {
        const roleSelect = modal.querySelector('#user-role-select') as HTMLSelectElement;
        const passwordInput = modal.querySelector('#new-password') as HTMLInputElement;
        const saveBtn = modal.querySelector('#save-user-btn') as HTMLButtonElement;
        
        // 显示保存状态
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
        saveBtn.disabled = true;
        
        let hasChanges = false;
        let success = true;
        const errors: string[] = [];
        
        try {
            // 处理角色更改
            const newRole = roleSelect.value as User['role'];
            if (newRole !== user.role) {
                // 先移除旧角色，再分配新角色
                if (user.role !== 'user') {
                    const removeSuccess = await removeRoleFromUser(user.email, user.role);
                    if (!removeSuccess) {
                        errors.push('移除旧角色失败');
                        success = false;
                    }
                }
                
                if (success && newRole !== 'user') {
                    const assignSuccess = await assignRoleToUser(user.email, newRole);
                    if (!assignSuccess) {
                        errors.push('分配新角色失败');
                        success = false;
                    }
                }
                
                if (success) {
                    hasChanges = true;
                }
            }
            
            // 处理密码重置
            const newPassword = passwordInput.value.trim();
            if (newPassword) {
                if (newPassword.length < 6) {
                    errors.push('密码长度至少为6位');
                    success = false;
                } else {
                    const resetSuccess = await resetUserPassword(user.email, newPassword);
                    if (!resetSuccess) {
                        errors.push('重置密码失败');
                        success = false;
                    } else {
                        hasChanges = true;
                    }
                }
            }
            
            // 显示结果
            if (success) {
                if (hasChanges) {
                    if ((window as any).notificationService) {
                        (window as any).notificationService.success('用户信息更新成功');
                    }
                    closeModal();
                    await refreshUsersList();
                } else {
                    if ((window as any).notificationService) {
                        (window as any).notificationService.info('没有检测到更改');
                    }
                    closeModal();
                }
            } else {
                if ((window as any).notificationService) {
                    (window as any).notificationService.error('更新失败：' + errors.join('，'));
                }
            }
            
        } finally {
            // 恢复按钮状态
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Error saving user changes:', error);
        if ((window as any).notificationService) {
            (window as any).notificationService.error('保存失败，请重试');
        }
    }
}

/**
 * 处理编辑用户
 */
async function handleEditUser(userId: string): Promise<void> {
    // 找到当前用户信息
    const filters = getCurrentFilters();
    const { users } = await getUsersList(filters, 1);
    const user = users.find(u => u.id === userId);
    
    if (user) {
        showEditUserModal(user);
    } else {
        if ((window as any).notificationService) {
            (window as any).notificationService.error('未找到用户信息');
        }
    }
}

/**
 * 处理切换用户状态
 */
async function handleToggleUserStatus(userId: string): Promise<void> {
    try {
        // 找到当前用户信息
        const filters = getCurrentFilters();
        const { users } = await getUsersList(filters, 1);
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            if ((window as any).notificationService) {
                (window as any).notificationService.error('未找到用户信息');
            }
            return;
        }
        
        const newStatus = user.status === 'active' ? false : true;
        const action = newStatus ? '启用' : '禁用';
        
        if (confirm(`确定要${action}用户 ${user.email} 吗？`)) {
            const success = await toggleUserStatus(user.email, newStatus);
            
            if (success) {
                if ((window as any).notificationService) {
                    (window as any).notificationService.success(`用户${action}成功`);
                }
                await refreshUsersList();
            } else {
                if ((window as any).notificationService) {
                    (window as any).notificationService.error(`用户${action}失败`);
                }
            }
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
        if ((window as any).notificationService) {
            (window as any).notificationService.error('操作失败，请重试');
        }
    }
}

/**
 * 处理删除用户（暂不实现，显示提示）
 */
async function handleDeleteUser(userId: string): Promise<void> {
    if ((window as any).notificationService) {
        (window as any).notificationService.warning('删除用户功能暂未实现，请联系系统管理员');
    }
}

/**
 * 处理添加用户
 */
function handleAddUser(): void {
    console.log('添加新用户');
    // 实现添加用户逻辑
}

/**
 * 处理分页点击
 */
async function handlePaginationClick(event: Event): Promise<void> {
    const target = event.target as HTMLElement;
    const button = target.closest('[data-page]') as HTMLElement;
    
    if (button && !button.hasAttribute('disabled')) {
        const page = parseInt(button.dataset.page!);
        await refreshUsersList(page);
    }
}

/**
 * 获取当前筛选条件
 */
function getCurrentFilters(): UserFilters {
    const emailInput = document.getElementById('email-filter') as HTMLInputElement;
    const nameInput = document.getElementById('name-filter') as HTMLInputElement;
    const phoneInput = document.getElementById('phone-filter') as HTMLInputElement;
    const wechatInput = document.getElementById('wechat-filter') as HTMLInputElement;
    const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
    const roleFilter = document.getElementById('role-filter') as HTMLSelectElement;
    
    return {
        email: emailInput?.value || '',
        name: nameInput?.value || '',
        phone: phoneInput?.value || '',
        wechat: wechatInput?.value || '',
        status: (statusFilter?.value as UserFilters['status']) || 'all',
        role: (roleFilter?.value as UserFilters['role']) || 'all'
    };
}

/**
 * 刷新用户列表
 */
async function refreshUsersList(page: number = 1): Promise<void> {
    try {
        const filters = getCurrentFilters();
        const { users, pagination } = await getUsersList(filters, page);
        
        const tableContainer = document.getElementById('users-table-container');
        const paginationContainer = document.getElementById('pagination-container');
        
        if (tableContainer) {
            tableContainer.innerHTML = generateDesktopUserTable(users) + generateMobileUserList(users);
        }
        
        if (paginationContainer) {
            paginationContainer.innerHTML = `
                <div class="text-sm text-gray-700">
                    显示第 ${(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} 项，共 ${pagination.totalItems} 项
                </div>
                <div class="flex items-center space-x-2">
                    <button class="btn btn-sm btn-secondary" ${pagination.currentPage === 1 ? 'disabled' : ''} data-page="${pagination.currentPage - 1}">
                        上一页
                    </button>
                    <span class="px-3 py-1 text-sm text-gray-600">第 ${pagination.currentPage} / ${pagination.totalPages} 页</span>
                    <button class="btn btn-sm btn-secondary" ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''} data-page="${pagination.currentPage + 1}">
                        下一页
                    </button>
                </div>
            `;
        }
        
        // 重新设置事件监听器
        setupUserActions();
        setupPagination();
        
    } catch (error) {
        console.error('Error refreshing users list:', error);
    }
}
