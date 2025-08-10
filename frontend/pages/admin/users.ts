/**
 * 用户管理页面内容 - TypeScript版本
 */

import { httpClient } from '../../src/services/http-client';
import { roleManager, getRoleDisplayNameSync as getRoleDisplayName } from '../../src/config/roles';

interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
    wechatNickname?: string;
    avatar: string;
    role: 'admin' | 'user' | 'staff';
    status: 'active' | 'disabled';
    createdAt: string;
    lastLogin?: string;
    roles: string[];
}

export interface Role {
    id: string;
    name: string;
    description: string;
    createdAt?: string;
    updatedAt?: string;
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
        console.log('Fetching users from:', url);
        
        const response = await httpClient.get(url);
        console.log('User list response:', response);
        
        if (response.success && response.data) {
            // httpClient现在已经自动处理嵌套数据结构并转换字段名为驼峰
            let users = (Array.isArray(response.data) ? response.data : response.data.users || []).map((user: any) => ({
                id: user.id?.toString() || '',
                email: user.email || '',
                name: user.name || '',
                phone: user.phone || '',
                wechatNickname: user.wechatNickname || '',
                avatar: user.avatar || '',
                role: (user.roles && user.roles.length > 0 ? user.roles[0] : 'user') as User['role'],
                status: user.active ? 'active' as const : 'disabled' as const,
                createdAt: user.createdAt || new Date().toISOString(),
                lastLogin: user.lastLoginAt || undefined,
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
        const response = await httpClient.post('/admin/toggle-user', {
            email,
            active
        });
        
        if (response.success && response.data) {
            // httpClient已统一处理数据结构，直接使用success字段
            return response.data.success;
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
        const response = await httpClient.post('/admin/assign-role', {
            email,
            role
        });
        
        if (response.success && response.data) {
            // httpClient已统一处理数据结构，直接使用success字段
            return response.data.success;
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
        const response = await httpClient.post('/admin/remove-role', {
            email,
            role
        });
        
        if (response.success && response.data) {
            // httpClient已统一处理数据结构，直接使用success字段
            return response.data.success;
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
        const response = await httpClient.post('/admin/reset-password', {
            email,
            new_password: newPassword
        });
        
        if (response.success && response.data) {
            // httpClient已统一处理数据结构，直接使用success字段
            return response.data.success;
        }
        
        return false;
    } catch (error) {
        console.error('Error resetting user password:', error);
        return false;
    }
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
 * 创建编辑用户模态框
 */
async function createEditUserModal(user: User): Promise<HTMLElement> {
    // 确保角色数据是最新的
    const availableRoles = await roleManager.getAllRoles();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'edit-user-modal';
    
    const rolesList = (user.roles || []).map(role => 
        `<div class="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            <span>${getRoleDisplayName(role)}</span>
            <button type="button" class="ml-2 text-blue-600 hover:text-blue-800" 
                    data-action="remove-role" data-role="${role}">
                <i class="fas fa-times text-xs"></i>
            </button>
        </div>`
    ).join('');
    
    // 生成角色选项，排除用户已有的角色
    const roleOptions = availableRoles
        .filter(role => !user.roles?.includes(role.code))
        .map(role => `<option value="${role.code}">${role.displayName}${role.description ? ` - ${role.description}` : ''}</option>`)
        .join('');
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">编辑用户</h3>
                <button type="button" class="text-gray-400 hover:text-gray-600" id="close-modal-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-6">
                <div class="border-b border-gray-200 pb-4">
                    <h4 class="font-medium text-gray-900 mb-2">基本信息</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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
                            <span class="ml-2">${user.wechatNickname || '未设置'}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">当前状态:</span>
                            <span class="ml-2">
                                <span class="${getStatusDisplay(user.status).className}">${getStatusDisplay(user.status).label}</span>
                            </span>
                        </div>
                        <div>
                            <span class="text-gray-500">注册时间:</span>
                            <span class="ml-2">${formatDate(user.createdAt)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="border-b border-gray-200 pb-4">
                    <h4 class="font-medium text-gray-900 mb-3">角色管理</h4>
                    <div class="space-y-4">
                        <div>
                            <label class="form-label">当前角色</label>
                            <div class="flex flex-wrap gap-2 mb-2" id="current-roles">
                                ${rolesList}
                                ${(!user.roles || user.roles.length === 0) ? '<span class="text-gray-400 text-sm">无角色</span>' : ''}
                            </div>
                        </div>
                        
                        <div>
                            <label class="form-label">添加角色</label>
                            <div class="flex gap-2">
                                <select id="role-to-add" class="form-select flex-1">
                                    <option value="">选择要添加的角色</option>
                                    ${roleOptions}
                                </select>
                                <button type="button" class="btn btn-secondary" id="add-role-btn">
                                    <i class="fas fa-plus mr-1"></i>添加
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
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
    const addRoleBtn = modal.querySelector('#add-role-btn') as HTMLButtonElement;
    
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
    
    // 角色移除事件
    modal.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        const removeBtn = target.closest('[data-action="remove-role"]') as HTMLElement;
        
        if (removeBtn) {
            const roleToRemove = removeBtn.dataset.role;
            if (roleToRemove && confirm(`确定要移除角色 "${getRoleDisplayName(roleToRemove)}" 吗？`)) {
                const success = await removeRoleFromUser(user.email, roleToRemove);
                if (success) {
                    (window as any).notificationService?.success('角色移除成功');
                    
                    // 更新用户的角色数据
                    user.roles = user.roles?.filter(role => role !== roleToRemove) || [];
                    
                    // 重新刷新角色选择下拉框
                    await refreshRoleSelector(modal, user);
                    
                    // 刷新用户列表
                    await refreshUsersList();
                } else {
                    (window as any).notificationService?.error('角色移除失败');
                }
            }
        }
    });
    
    // 添加角色事件
    addRoleBtn?.addEventListener('click', async () => {
        const roleSelect = modal.querySelector('#role-to-add') as HTMLSelectElement;
        const roleToAdd = roleSelect.value;
        
        if (!roleToAdd) {
            (window as any).notificationService?.warning('请选择要添加的角色');
            return;
        }
        
        if (user.roles?.includes(roleToAdd)) {
            (window as any).notificationService?.warning('用户已拥有此角色');
            return;
        }
        
        const success = await assignRoleToUser(user.email, roleToAdd);
        if (success) {
            (window as any).notificationService?.success('角色添加成功');
            
            // 更新用户的角色数据
            user.roles = [...(user.roles || []), roleToAdd];
            
            // 重新刷新角色选择下拉框
            await refreshRoleSelector(modal, user);
            
            // 刷新用户列表
            await refreshUsersList();
        } else {
            (window as any).notificationService?.error('角色添加失败');
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
        const passwordInput = modal.querySelector('#new-password') as HTMLInputElement;
        const saveBtn = modal.querySelector('#save-user-btn') as HTMLButtonElement;
        
        // 显示保存状态
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
        saveBtn.disabled = true;
        
        let hasChanges = false;
        let success = true;
        
        try {
            // 处理密码更改
            const newPassword = passwordInput.value.trim();
            if (newPassword) {
                if (newPassword.length < 6) {
                    (window as any).notificationService?.error('密码最少6位字符');
                    return;
                }
                
                const passwordSuccess = await resetUserPassword(user.email, newPassword);
                if (passwordSuccess) {
                    hasChanges = true;
                } else {
                    success = false;
                    (window as any).notificationService?.error('密码重置失败');
                }
            }
            
            if (success) {
                if (hasChanges) {
                    (window as any).notificationService?.success('用户信息更新成功');
                    await refreshUsersList();
                }
                closeModal();
            }
        } finally {
            // 恢复按钮状态
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error saving user changes:', error);
    }
}

/**
 * 刷新角色选择器
 */
async function refreshRoleSelector(modal: HTMLElement, user: User): Promise<void> {
    // 更新角色数据
    const availableRoles = await roleManager.getAllRoles();
    
    // 重新生成当前角色显示
    const currentRolesContainer = modal.querySelector('#current-roles') as HTMLElement;
    const rolesList = (user.roles || []).map(role => 
        `<div class="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            <span>${getRoleDisplayName(role)}</span>
            <button type="button" class="ml-2 text-blue-600 hover:text-blue-800" 
                    data-action="remove-role" data-role="${role}">
                <i class="fas fa-times text-xs"></i>
            </button>
        </div>`
    ).join('');
    
    currentRolesContainer.innerHTML = rolesList || '<span class="text-gray-400 text-sm">无角色</span>';
    
    // 重新生成角色选择下拉框
    const roleSelect = modal.querySelector('#role-to-add') as HTMLSelectElement;
    const roleOptions = availableRoles
        .filter(role => !user.roles?.includes(role.code))
        .map(role => `<option value="${role.code}">${role.displayName}${role.description ? ` - ${role.description}` : ''}</option>`)
        .join('');
    
    roleSelect.innerHTML = `
        <option value="">选择要添加的角色</option>
        ${roleOptions}
    `;
}

/**
 * 显示编辑用户模态框
 */
async function showEditUserModal(user: User): Promise<void> {
    const modal = await createEditUserModal(user);
    document.body.appendChild(modal);
    
    // 显示模态框
    modal.style.display = 'flex';
    
    // 设置事件监听器
    setupEditUserModal(modal, user);
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
                                    ${user.wechatNickname ? `<div class="text-xs text-gray-600"><i class="fab fa-weixin mr-1"></i>${user.wechatNickname}</div>` : ''}
                                    ${!user.phone && !user.wechatNickname ? '<span class="text-xs text-gray-400">未填写</span>' : ''}
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
                            ${user.wechatNickname ? `<div class="text-xs text-gray-600"><i class="fab fa-weixin mr-1"></i>${user.wechatNickname}</div>` : ''}
                            ${!user.phone && !user.wechatNickname ? '<span class="text-xs text-gray-400">未填写</span>' : ''}
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
 * 生成分页HTML
 */
function generatePaginationHTML(pagination: PaginationInfo): string {
    return `
        <div class="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <div class="text-sm text-gray-700">
                显示第 ${(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} 项，共 ${pagination.totalItems} 项
            </div>
            <div class="flex items-center space-x-2">
                <button class="btn btn-sm btn-secondary" ${pagination.currentPage === 1 ? 'disabled' : ''} data-page="${pagination.currentPage - 1}">
                    <i class="fas fa-chevron-left mr-1"></i>
                    上一页
                </button>
                
                ${Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (pagination.totalPages > 5) {
                        if (pagination.currentPage > 3) {
                            pageNum = pagination.currentPage - 2 + i;
                        }
                        if (pageNum > pagination.totalPages) {
                            pageNum = pagination.totalPages - 4 + i;
                        }
                    }
                    return `
                        <button class="btn btn-sm ${pageNum === pagination.currentPage ? 'btn-primary' : 'btn-secondary'}" 
                                data-page="${pageNum}">
                            ${pageNum}
                        </button>
                    `;
                }).join('')}
                
                <button class="btn btn-sm btn-secondary" ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''} data-page="${pagination.currentPage + 1}">
                    下一页
                    <i class="fas fa-chevron-right ml-1"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * 获取用户管理页面内容
 */
export async function getUsersPageContent(): Promise<string> {
    // 确保角色数据是最新的
    const availableRoles = await roleManager.getAllRoles();
    
    const defaultFilters: UserFilters = { 
        email: '', 
        name: '', 
        phone: '', 
        wechat: '', 
        status: 'all', 
        role: 'all' 
    };
    const { users, pagination } = await getUsersList(defaultFilters, 1);

    // 生成角色筛选选项
    const roleFilterOptions = availableRoles
        .map(role => `<option value="${role.code}">${role.displayName}</option>`)
        .join('');

    return `
        <div class="space-y-6">
            <!-- 页面标题和操作 -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">用户管理</h2>
                    <p class="text-gray-600 mt-1">管理系统用户和权限</p>
                </div>
                <div class="flex flex-col sm:flex-row gap-2">
                    <button class="btn btn-primary" onclick="handleAddUser()">
                        <i class="fas fa-plus mr-2"></i>
                        添加用户
                    </button>
                </div>
            </div>

            <!-- 筛选器 -->
            <div class="bg-white p-4 rounded-lg shadow border">
                <h3 class="text-lg font-medium text-gray-900 mb-4">筛选条件</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="form-label">邮箱</label>
                        <input type="text" id="filter-email" class="form-input" placeholder="搜索邮箱">
                    </div>
                    <div>
                        <label class="form-label">姓名</label>
                        <input type="text" id="filter-name" class="form-input" placeholder="搜索姓名">
                    </div>
                    <div>
                        <label class="form-label">电话</label>
                        <input type="text" id="filter-phone" class="form-input" placeholder="搜索电话">
                    </div>
                    <div>
                        <label class="form-label">微信昵称</label>
                        <input type="text" id="filter-wechat" class="form-input" placeholder="搜索微信昵称">
                    </div>
                    <div>
                        <label class="form-label">状态</label>
                        <select id="filter-status" class="form-select">
                            <option value="all">全部状态</option>
                            <option value="active">活跃</option>
                            <option value="disabled">禁用</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">角色</label>
                        <select id="filter-role" class="form-select">
                            <option value="all">全部角色</option>
                            ${roleFilterOptions}
                        </select>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2 mt-4">
                    <button class="btn btn-primary" id="search-btn">
                        <i class="fas fa-search mr-2"></i>
                        搜索
                    </button>
                    <button class="btn btn-secondary" id="refresh-btn">
                        <i class="fas fa-sync-alt mr-2"></i>
                        刷新
                    </button>
                    <button class="btn btn-secondary" id="clear-filters-btn">
                        <i class="fas fa-times mr-2"></i>
                        清空筛选
                    </button>
                </div>
            </div>

            <!-- 用户列表 -->
            <div class="bg-white rounded-lg shadow border">
                <div class="p-4 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-medium text-gray-900">用户列表</h3>
                        <div class="text-sm text-gray-500">
                            共 ${pagination.totalItems} 个用户
                        </div>
                    </div>
                </div>
                
                <div id="users-table-container">
                    ${generateDesktopUserTable(users)}
                    ${generateMobileUserList(users)}
                </div>
                
                <div class="p-4 border-t border-gray-200">
                    <div id="pagination-container">
                        ${generatePaginationHTML(pagination)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 导出函数供外部使用
(window as any).showEditUserModal = showEditUserModal;

/**
 * 初始化用户管理页面
 */
export async function initializeUsersPage(): Promise<void> {
    // 初始化角色系统
    await roleManager.refreshRoles();
    
    setupFilters();
    setupUserActions();
    setupPagination();
    setupSearchButtons();
}

/**
 * 设置筛选功能
 */
function setupFilters(): void {
    const filterInputs = document.querySelectorAll('#filter-email, #filter-name, #filter-phone, #filter-wechat');
    filterInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if ((e as KeyboardEvent).key === 'Enter') {
                handleSearch();
            }
        });
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
    const clearBtn = document.getElementById('clear-filters-btn');

    searchBtn?.addEventListener('click', handleSearch);
    refreshBtn?.addEventListener('click', handleRefresh);
    clearBtn?.addEventListener('click', handleClearFilters);
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
    const emailInput = document.getElementById('filter-email') as HTMLInputElement;
    const nameInput = document.getElementById('filter-name') as HTMLInputElement;
    const phoneInput = document.getElementById('filter-phone') as HTMLInputElement;
    const wechatInput = document.getElementById('filter-wechat') as HTMLInputElement;
    const statusSelect = document.getElementById('filter-status') as HTMLSelectElement;
    const roleSelect = document.getElementById('filter-role') as HTMLSelectElement;

    if (emailInput) emailInput.value = '';
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (wechatInput) wechatInput.value = '';
    if (statusSelect) statusSelect.value = 'all';
    if (roleSelect) roleSelect.value = 'all';

    await refreshUsersList(1);
}

/**
 * 获取当前页码
 */
function getCurrentPage(): number {
    const activePageBtn = document.querySelector('[data-page].btn-primary') as HTMLElement;
    return activePageBtn ? parseInt(activePageBtn.dataset.page || '1') : 1;
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
 * 处理编辑用户
 */
async function handleEditUser(userId: string): Promise<void> {
    // 根据用户ID查找用户数据
    const filters = getCurrentFilters();
    const { users } = await getUsersList(filters, getCurrentPage());
    const user = users.find(u => u.id === userId);
    
    if (user) {
        await showEditUserModal(user);
    } else {
        (window as any).notificationService?.error('用户不存在');
    }
}

/**
 * 处理切换用户状态
 */
async function handleToggleUserStatus(userId: string): Promise<void> {
    const filters = getCurrentFilters();
    const { users } = await getUsersList(filters, getCurrentPage());
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        (window as any).notificationService?.error('用户不存在');
        return;
    }
    
    const newStatus = user.status === 'active' ? false : true;
    const action = newStatus ? '启用' : '禁用';
    
    if (confirm(`确定要${action}用户 ${user.email} 吗？`)) {
        const success = await toggleUserStatus(user.email, newStatus);
        if (success) {
            (window as any).notificationService?.success(`用户${action}成功`);
            await refreshUsersList();
        } else {
            (window as any).notificationService?.error(`用户${action}失败`);
        }
    }
}

/**
 * 处理删除用户（暂不实现，显示提示）
 */
async function handleDeleteUser(userId: string): Promise<void> {
    (window as any).notificationService?.warning('删除用户功能暂未开放');
}

/**
 * 处理添加用户
 */
function handleAddUser(): void {
    (window as any).notificationService?.info('添加用户功能正在开发中');
}

/**
 * 处理分页点击
 */
async function handlePaginationClick(event: Event): Promise<void> {
    const target = event.target as HTMLElement;
    const button = target.closest('[data-page]') as HTMLElement;
    
    if (button && !button.hasAttribute('disabled')) {
        const page = parseInt(button.dataset.page || '1');
        await refreshUsersList(page);
    }
}

/**
 * 获取当前筛选条件
 */
function getCurrentFilters(): UserFilters {
    const emailInput = document.getElementById('filter-email') as HTMLInputElement;
    const nameInput = document.getElementById('filter-name') as HTMLInputElement;
    const phoneInput = document.getElementById('filter-phone') as HTMLInputElement;
    const wechatInput = document.getElementById('filter-wechat') as HTMLInputElement;
    const statusSelect = document.getElementById('filter-status') as HTMLSelectElement;
    const roleSelect = document.getElementById('filter-role') as HTMLSelectElement;

    return {
        email: emailInput?.value || '',
        name: nameInput?.value || '',
        phone: phoneInput?.value || '',
        wechat: wechatInput?.value || '',
        status: (statusSelect?.value as UserFilters['status']) || 'all',
        role: (roleSelect?.value as UserFilters['role']) || 'all'
    };
}

/**
 * 刷新用户列表
 */
async function refreshUsersList(page: number = 1): Promise<void> {
    try {
        const filters = getCurrentFilters();
        const { users, pagination } = await getUsersList(filters, page);
        
        // 更新表格内容
        const tableContainer = document.getElementById('users-table-container');
        if (tableContainer) {
            tableContainer.innerHTML = generateDesktopUserTable(users) + generateMobileUserList(users);
        }
        
        // 更新分页
        const paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) {
            paginationContainer.innerHTML = generatePaginationHTML(pagination);
        }
        
        // 重新绑定事件
        setupUserActions();
        setupPagination();
        
    } catch (error) {
        console.error('Error refreshing users list:', error);
        (window as any).notificationService?.error('刷新用户列表失败');
    }
}

// 导出全局函数
(window as any).handleAddUser = handleAddUser;
(window as any).refreshUsersList = refreshUsersList;
