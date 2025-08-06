/**
 * 用户个人中心页面内容 - TypeScript版本
 */

import { authStore } from '../../src/stores/auth-store';
import { httpClient } from '../../src/services/http-client';

export interface UserProfile {
    id: string;
    email: string;
    name?: string;
    wechatNickname?: string;
    role: 'admin' | 'paid1' | 'paid2' | 'user';
    status: 'active' | 'disabled';
    createdAt: string;
    lastLogin?: string;
    avatar?: string;
    phone?: string;
    address?: string;
}

export interface AccountStats {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    processingOrders?: number;
    totalSpent: number;
}

/**
 * 获取用户档案数据
 */
export async function getUserProfile(): Promise<UserProfile> {
    try {
        // 首先获取当前登录用户的基本信息
        const currentUser = authStore.getCurrentUser();
        
        // 尝试从API获取完整的用户档案信息
        const response = await httpClient.get<any>('/api/profile');
        
        if (response.success && response.data) {
            // httpClient将后端响应包装在data字段中，后端返回格式：{success: true, data: {...}}
            // 所以实际的用户数据在 response.data（这是后端响应的完整对象）
            const backendResponse = response.data;
            
            if (backendResponse.success && backendResponse.data) {
                const data = backendResponse.data;
                
                const profile: UserProfile = {
                    id: data.id?.toString() || currentUser?.id?.toString() || '1',
                    email: data.email || currentUser?.email || '',
                    name: data.name || currentUser?.name || '',
                    wechatNickname: data.wechatNickname || '',
                    role: (data.roles?.[0] || currentUser?.roles?.[0] || 'user') as any,
                    status: data.active ? 'active' as const : 'disabled' as const,
                    createdAt: data.createdAt || currentUser?.createdAt || new Date().toISOString(),
                    lastLogin: data.lastLoginAt || currentUser?.lastLoginAt || undefined,
                    phone: data.phone || '',
                    address: data.address || ''
                };
                
                return profile;
            }
        }
        
        // 如果API失败，直接使用当前登录用户的信息作为基础
        if (currentUser) {
            return {
                id: currentUser.id?.toString() || '1',
                email: currentUser.email || '',
                name: currentUser.name || '',
                wechatNickname: '',
                role: (currentUser.roles?.[0] || 'user') as any,
                status: 'active',
                createdAt: currentUser.createdAt || new Date().toISOString(),
                lastLogin: currentUser.lastLoginAt || undefined,
                phone: '',
                address: ''
            };
        }
        
        // 最后的备用选项
        return {
            id: '1',
            email: 'user@example.com',
            name: '',
            wechatNickname: '',
            role: 'user',
            status: 'active',
            createdAt: new Date().toISOString(),
            phone: '',
            address: ''
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        
        // 发生错误时，优先使用当前用户信息作为备用
        const currentUser = authStore.getCurrentUser();
        if (currentUser) {
            return {
                id: currentUser.id?.toString() || '1',
                email: currentUser.email || '',
                name: currentUser.name || '',
                wechatNickname: '',
                role: (currentUser.roles?.[0] || 'user') as any,
                status: 'active',
                createdAt: currentUser.createdAt || new Date().toISOString(),
                lastLogin: currentUser.lastLoginAt || undefined,
                phone: '',
                address: ''
            };
        }
        
        return {
            id: '1',
            email: 'user@example.com',
            name: '',
            wechatNickname: '',
            role: 'user',
            status: 'active',
            createdAt: new Date().toISOString(),
            phone: '',
            address: ''
        };
    }
}

/**
 * 获取账户统计数据
 */
export async function getAccountStats(): Promise<AccountStats> {
    try {
        // 调用订单统计API
        const response = await httpClient.get<any>('/api/orders/stats');
        
        if (response.success && response.data) {
            const backendResponse = response.data;
            
            if (backendResponse.success && backendResponse.data) {
                const stats = backendResponse.data;
                return {
                    totalOrders: stats.totalOrders || 0,
                    completedOrders: stats.completedOrders || 0,
                    pendingOrders: stats.pendingOrders || 0,
                    processingOrders: stats.processingOrders || 0,
                    totalSpent: stats.totalSpent || 0
                };
            }
        }
        
        // 如果API调用失败，返回默认值
        return {
            totalOrders: 0,
            completedOrders: 0,
            pendingOrders: 0,
            processingOrders: 0,
            totalSpent: 0
        };
        
    } catch (error) {
        console.error('Error fetching account stats:', error);
        
        // 发生错误时返回默认值
        return {
            totalOrders: 0,
            completedOrders: 0,
            pendingOrders: 0,
            processingOrders: 0,
            totalSpent: 0
        };
    }
}

/**
 * 获取角色显示名称
 */
export function getRoleDisplayName(role: UserProfile['role']): string {
    const roleMap: Record<UserProfile['role'], string> = {
        'admin': '管理员',
        'paid1': 'VIP用户',
        'paid2': '高级用户',
        'user': '普通用户'
    };
    return roleMap[role];
}

/**
 * 生成账户统计卡片HTML
 */
function generateStatsCards(stats: AccountStats): string {
    return `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 lg:p-4 text-white">
                <div class="text-lg lg:text-2xl font-bold">${stats.totalOrders}</div>
                <div class="text-xs lg:text-sm opacity-90">总订单数</div>
            </div>
            <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-3 lg:p-4 text-white">
                <div class="text-lg lg:text-2xl font-bold">${stats.completedOrders}</div>
                <div class="text-xs lg:text-sm opacity-90">已完成</div>
            </div>
            <div class="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-3 lg:p-4 text-white">
                <div class="text-lg lg:text-2xl font-bold">${stats.processingOrders || 0}</div>
                <div class="text-xs lg:text-sm opacity-90">处理中</div>
            </div>
            <div class="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-3 lg:p-4 text-white">
                <div class="text-lg lg:text-2xl font-bold">${stats.pendingOrders}</div>
                <div class="text-xs lg:text-sm opacity-90">待处理</div>
            </div>
        </div>
    `;
}

/**
 * 生成账户信息表单HTML
 */
function generateAccountInfoForm(profile: UserProfile): string {
    // 安全地处理可能为空的值，避免显示 "undefined" 或 "null"
    const safeName = profile.name || '';
    const safeWechatNickname = profile.wechatNickname || '';
    const safeEmail = profile.email || '';
    const safePhone = profile.phone || '';
    
    return `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div>
                <label class="form-label">姓名</label>
                <input type="text" id="profile-name" class="form-input" value="${safeName}" placeholder="请输入真实姓名">
                <small class="text-gray-500 text-xs mt-1">显示在您的个人资料中</small>
            </div>
            <div>
                <label class="form-label">微信昵称</label>
                <input type="text" id="profile-wechat-nickname" class="form-input" value="${safeWechatNickname}" placeholder="请输入微信昵称">
                <small class="text-gray-500 text-xs mt-1">便于我们联系您</small>
            </div>
            <div>
                <label class="form-label">邮箱地址</label>
                <input type="email" id="profile-email" class="form-input" value="${safeEmail}" readonly>
                <small class="text-gray-500 text-xs mt-1">邮箱地址不能修改</small>
            </div>
            <div>
                <label class="form-label">联系电话</label>
                <input type="tel" id="profile-phone" class="form-input" value="${safePhone}" placeholder="请输入联系电话">
                <small class="text-gray-500 text-xs mt-1">用于紧急联系和服务通知</small>
            </div>
        </div>
        <div class="flex justify-between items-center mt-6">
            <div class="text-sm text-gray-500">
                <i class="fas fa-info-circle mr-1"></i>
                信息已从您的登录账户自动填充
            </div>
            <div class="flex space-x-3">
                <button class="btn btn-secondary" id="refresh-profile-btn">
                    <i class="fas fa-sync-alt mr-2"></i>
                    刷新数据
                </button>
                <button class="btn btn-primary" id="save-profile-btn">
                    <i class="fas fa-save mr-2"></i>
                    保存更改
                </button>
            </div>
        </div>
    `;
}

/**
 * 生成安全设置HTML
 */
function generateSecuritySettings(): string {
    return `
        <div class="space-y-3 lg:space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 border border-gray-200 rounded-md space-y-2 sm:space-y-0">
                <div>
                    <h3 class="text-sm font-medium text-gray-900">修改密码</h3>
                    <p class="text-xs lg:text-sm text-gray-500">定期更新密码以保护账户安全</p>
                </div>
                <button class="btn btn-sm btn-primary" id="change-password-btn">
                    修改密码
                </button>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 border border-gray-200 rounded-md space-y-2 sm:space-y-0">
                <div>
                    <h3 class="text-sm font-medium text-gray-900">账户注销</h3>
                    <p class="text-xs lg:text-sm text-gray-500">永久删除账户和所有相关数据</p>
                </div>
                <button class="btn btn-sm btn-danger" id="delete-account-btn">
                    注销账户
                </button>
            </div>
        </div>
    `;
}

/**
 * 获取个人中心页面内容
 */
export async function getProfilePageContent(): Promise<string> {
    try {
        // 并行获取用户资料和统计数据
        const [profile, stats] = await Promise.all([
            getUserProfile(),
            getAccountStats()
        ]);

        return `
            <div class="space-y-4 lg:space-y-6 fade-in">
                <!-- 账户统计 -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="text-lg font-semibold text-gray-900">账户概览</h2>
                        <p class="text-sm text-gray-500 mt-1">您的订单统计概览</p>
                    </div>
                    <div class="card-body">
                        ${generateStatsCards(stats)}
                    </div>
                </div>

                <!-- 账户信息 -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="text-lg font-semibold text-gray-900">账户信息</h2>
                        <p class="text-sm text-gray-500 mt-1">更新您的个人信息</p>
                    </div>
                    <div class="card-body">
                        ${generateAccountInfoForm(profile)}
                    </div>
                </div>

                <!-- 安全设置 -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="text-lg font-semibold text-gray-900">安全设置</h2>
                        <p class="text-sm text-gray-500 mt-1">管理您的账户安全</p>
                    </div>
                    <div class="card-body">
                        ${generateSecuritySettings()}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading profile page content:', error);
        
        // 如果加载失败，显示错误页面
        return `
            <div class="space-y-4 lg:space-y-6 fade-in">
                <div class="card">
                    <div class="card-body text-center py-12">
                        <div class="w-24 h-24 mx-auto mb-4 text-gray-300">
                            <i class="fas fa-exclamation-triangle text-6xl"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
                        <p class="text-gray-500 mb-6">无法加载个人中心内容，请检查网络连接或稍后重试</p>
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            <i class="fas fa-sync-alt mr-2"></i>
                            重新加载
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// 用于防止重复API调用的标志
let isRefreshing = false;

/**
 * 初始化个人中心页面
 */
export async function initializeProfilePage(): Promise<void> {
    try {
        // 设置保存档案事件
        setupProfileSave();
        
        // 设置安全设置事件
        setupSecurityActions();
        
        // 监听认证状态变化，自动更新表单字段
        authStore.subscribe(async (user) => {
            if (user && !isRefreshing) {
                // 当用户信息发生变化时，更新表单字段
                // 但避免在手动刷新期间重复调用
                try {
                    const updatedProfile = await getUserProfile();
                    updateFormFields(updatedProfile);
                } catch (error) {
                    console.warn('Failed to update form fields after auth change:', error);
                }
            }
        });
        
        console.log('Profile page initialized with TypeScript and auto-fill functionality');
    } catch (error) {
        console.error('Error initializing profile page:', error);
    }
}

/**
 * 设置档案保存功能
 */
function setupProfileSave(): void {
    const saveBtn = document.getElementById('save-profile-btn');
    const refreshBtn = document.getElementById('refresh-profile-btn');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveProfile);
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefreshProfile);
    }
}

/**
 * 处理刷新用户档案数据
 */
async function handleRefreshProfile(): Promise<void> {
    try {
        const refreshBtn = document.getElementById('refresh-profile-btn') as HTMLButtonElement;
        
        if (refreshBtn) {
            // 设置刷新标志，防止订阅回调重复调用
            isRefreshing = true;
            
            // 显示加载状态
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>刷新中...';
            refreshBtn.disabled = true;
            
            // 并行获取最新的用户档案数据和统计数据
            const [updatedProfile, updatedStats] = await Promise.all([
                getUserProfile(),
                getAccountStats()
            ]);
            
            // 更新表单字段
            updateFormFields(updatedProfile);
            
            // 更新统计卡片
            const statsContainer = document.querySelector('.card-body');
            if (statsContainer && statsContainer.innerHTML.includes('总订单数')) {
                statsContainer.innerHTML = generateStatsCards(updatedStats);
            }
            
            if ((window as any).notificationService) {
                (window as any).notificationService.success('用户信息和统计数据已刷新');
            }
            
            // 恢复按钮状态
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Error refreshing profile:', error);
        
        const refreshBtn = document.getElementById('refresh-profile-btn') as HTMLButtonElement;
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>刷新数据';
            refreshBtn.disabled = false;
        }
        
        if ((window as any).notificationService) {
            (window as any).notificationService.error('刷新失败，请重试');
        }
    } finally {
        // 确保在函数结束时清除刷新标志
        isRefreshing = false;
    }
}

/**
 * 更新表单字段值
 */
function updateFormFields(profile: UserProfile): void {
    const nameInput = document.getElementById('profile-name') as HTMLInputElement;
    const wechatNicknameInput = document.getElementById('profile-wechat-nickname') as HTMLInputElement;
    const emailInput = document.getElementById('profile-email') as HTMLInputElement;
    const phoneInput = document.getElementById('profile-phone') as HTMLInputElement;
    
    if (nameInput) nameInput.value = profile.name || '';
    if (wechatNicknameInput) wechatNicknameInput.value = profile.wechatNickname || '';
    if (emailInput) emailInput.value = profile.email || '';
    if (phoneInput) phoneInput.value = profile.phone || '';
}

/**
 * 设置安全操作事件
 */
function setupSecurityActions(): void {
    const changePasswordBtn = document.getElementById('change-password-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', handleChangePassword);
    }
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    }
}

/**
 * 处理保存档案
 */
async function handleSaveProfile(): Promise<void> {
    try {
        const nameInput = document.getElementById('profile-name') as HTMLInputElement;
        const wechatNicknameInput = document.getElementById('profile-wechat-nickname') as HTMLInputElement;
        const phoneInput = document.getElementById('profile-phone') as HTMLInputElement;
        const saveBtn = document.getElementById('save-profile-btn') as HTMLButtonElement;
        
        // 验证必填字段
        if (!nameInput?.value.trim()) {
            if ((window as any).notificationService) {
                (window as any).notificationService.error('请输入您的姓名');
            }
            nameInput?.focus();
            return;
        }
        
        const profileData = {
            name: nameInput?.value.trim() || '',
            wechatNickname: wechatNicknameInput?.value.trim() || '',
            phone: phoneInput?.value.trim() || ''
        };
        
        // 显示保存状态
        if (saveBtn) {
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
            saveBtn.disabled = true;
            
            try {
                // 调用API保存数据
                const response = await httpClient.put<any>('/api/profile', profileData);
                
                if (response.success) {
                    // 更新本地存储的用户信息
                    await authStore.fetchUserProfile();
                    
                    // 显示成功消息
                    if ((window as any).notificationService) {
                        (window as any).notificationService.success(response.message || '档案信息已成功更新');
                    }
                    
                    // 可选：刷新页面数据以确保显示最新信息
                    setTimeout(() => {
                        handleRefreshProfile();
                    }, 500);
                    
                } else {
                    throw new Error(response.message || '更新失败');
                }
            } finally {
                // 恢复按钮状态
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        }
        
    } catch (error) {
        console.error('Error saving profile:', error);
        const errorMessage = error instanceof Error ? error.message : '保存失败，请重试';
        
        if ((window as any).notificationService) {
            (window as any).notificationService.error(errorMessage);
        }
        
        // 确保按钮状态恢复
        const saveBtn = document.getElementById('save-profile-btn') as HTMLButtonElement;
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>保存更改';
            saveBtn.disabled = false;
        }
    }
}

/**
 * 处理修改密码
 */
function handleChangePassword(): void {
    // 创建修改密码模态框
    const modal = createChangePasswordModal();
    document.body.appendChild(modal);
    
    // 显示模态框
    modal.style.display = 'flex';
    
    // 设置事件监听器
    setupChangePasswordModal(modal);
}

/**
 * 创建修改密码模态框
 */
function createChangePasswordModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'change-password-modal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">修改密码</h3>
                <button type="button" class="text-gray-400 hover:text-gray-600" id="close-modal-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="change-password-form" class="space-y-4">
                <div>
                    <label class="form-label">当前密码</label>
                    <input type="password" id="current-password" class="form-input" placeholder="请输入当前密码" required>
                </div>
                
                <div>
                    <label class="form-label">新密码</label>
                    <input type="password" id="new-password" class="form-input" placeholder="请输入新密码" required minlength="6">
                </div>
                
                <div>
                    <label class="form-label">确认新密码</label>
                    <input type="password" id="confirm-password" class="form-input" placeholder="请再次输入新密码" required>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" class="btn btn-secondary" id="cancel-btn">取消</button>
                    <button type="submit" class="btn btn-primary" id="confirm-change-btn">
                        <i class="fas fa-save mr-2"></i>
                        确认修改
                    </button>
                </div>
            </form>
        </div>
    `;
    
    return modal;
}

/**
 * 设置修改密码模态框事件
 */
function setupChangePasswordModal(modal: HTMLElement): void {
    const form = modal.querySelector('#change-password-form') as HTMLFormElement;
    const closeBtn = modal.querySelector('#close-modal-btn') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement;
    
    // 关闭模态框函数
    const closeModal = () => {
        modal.remove();
    };
    
    // 关闭按钮事件
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // 表单提交事件
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handlePasswordChange(modal);
    });
}

/**
 * 处理密码修改提交
 */
async function handlePasswordChange(modal: HTMLElement): Promise<void> {
    try {
        const currentPasswordInput = modal.querySelector('#current-password') as HTMLInputElement;
        const newPasswordInput = modal.querySelector('#new-password') as HTMLInputElement;
        const confirmPasswordInput = modal.querySelector('#confirm-password') as HTMLInputElement;
        
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // 验证输入
        if (!currentPassword || !newPassword || !confirmPassword) {
            if ((window as any).notificationService) {
                (window as any).notificationService.error('请填写所有密码字段');
            }
            return;
        }
        
        if (newPassword !== confirmPassword) {
            if ((window as any).notificationService) {
                (window as any).notificationService.error('新密码和确认密码不匹配');
            }
            return;
        }
        
        if (newPassword.length < 6) {
            if ((window as any).notificationService) {
                (window as any).notificationService.error('新密码长度至少为6位');
            }
            return;
        }
        
        // 调用API修改密码
        const response = await httpClient.post<any>('/api/change-password', {
            currentPassword,
            newPassword
        });
        
        if (response.success) {
            if ((window as any).notificationService) {
                (window as any).notificationService.success(response.message || '密码修改成功');
            }
            
            // 关闭模态框
            modal.remove();
        } else {
            throw new Error(response.message || '密码修改失败');
        }
        
    } catch (error) {
        console.error('Error changing password:', error);
        const errorMessage = error instanceof Error ? error.message : '密码修改失败，请重试';
        
        if ((window as any).notificationService) {
            (window as any).notificationService.error(errorMessage);
        }
    }
}

/**
 * 处理注销账户
 */
function handleDeleteAccount(): void {
    const confirmed = confirm('警告：此操作将永久删除您的账户和所有相关数据，此操作无法撤销。确定要继续吗？');
    
    if (confirmed) {
        console.log('注销账户');
        // 实现注销账户逻辑
        if ((window as any).notificationService) {
            (window as any).notificationService.warning('账户注销功能需要联系客服处理');
        }
    }
}
