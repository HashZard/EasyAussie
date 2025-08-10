/**
 * 角色管理页面 - 独立的角色层次结构管理
 */

import { RoleService, RoleUtils, Role, roleManager } from '../../src/config/roles';

export interface RoleTreeNode extends Role {
    children: RoleTreeNode[];
    expanded: boolean;
    depth: number;
}

export interface RoleFormData {
    code: string;
    display_name: string;
    description: string;
    level: number;
    parent_code?: string;
}

/**
 * 获取角色管理页面内容
 */
export async function getRolesPageContent(): Promise<string> {
    return `
        <div class="space-y-6">
            <!-- 页面标题和操作 -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">角色管理</h2>
                    <p class="text-gray-600 mt-1">管理系统角色层次结构和权限</p>
                </div>
                <div class="flex flex-col sm:flex-row gap-2">
                    <button class="btn btn-secondary" onclick="refreshRoleHierarchy()">
                        <i class="fas fa-sync-alt mr-2"></i>
                        刷新
                    </button>
                    <button class="btn btn-primary" onclick="showCreateRoleModal()">
                        <i class="fas fa-plus mr-2"></i>
                        创建角色
                    </button>
                </div>
            </div>

            <!-- 角色统计卡片 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white rounded-lg shadow border p-6">
                    <div class="flex items-center">
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <i class="fas fa-layer-group text-blue-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">总角色数</p>
                            <p class="text-2xl font-bold text-gray-900" id="total-roles-count">-</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow border p-6">
                    <div class="flex items-center">
                        <div class="p-2 bg-green-100 rounded-lg">
                            <i class="fas fa-sitemap text-green-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">层级深度</p>
                            <p class="text-2xl font-bold text-gray-900" id="max-depth-count">-</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow border p-6">
                    <div class="flex items-center">
                        <div class="p-2 bg-purple-100 rounded-lg">
                            <i class="fas fa-crown text-purple-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">顶级角色</p>
                            <p class="text-2xl font-bold text-gray-900" id="root-roles-count">-</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 角色层次结构树 -->
            <div class="bg-white rounded-lg shadow border">
                <div class="p-4 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-medium text-gray-900">角色层次结构</h3>
                        <div class="flex items-center space-x-2">
                            <button class="btn btn-sm btn-secondary" onclick="expandAllRoles()">
                                <i class="fas fa-expand-arrows-alt mr-1"></i>
                                展开全部
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="collapseAllRoles()">
                                <i class="fas fa-compress-arrows-alt mr-1"></i>
                                收起全部
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="p-4">
                    <div id="role-hierarchy-container" class="space-y-2">
                        <!-- 角色树将在这里动态生成 -->
                    </div>
                    
                    <div id="no-roles-message" class="text-center py-8 text-gray-500 hidden">
                        <i class="fas fa-layer-group text-4xl mb-4"></i>
                        <p>暂无角色数据</p>
                        <button class="btn btn-primary mt-4" onclick="showCreateRoleModal()">
                            创建第一个角色
                        </button>
                    </div>
                </div>
            </div>

            <!-- 角色详情面板 -->
            <div id="role-details-panel" class="bg-white rounded-lg shadow border hidden">
                <div class="p-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">角色详情</h3>
                </div>
                <div class="p-4">
                    <div id="role-details-content">
                        <!-- 角色详情内容将在这里显示 -->
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 初始化角色管理页面
 */
export async function initializeRolesPage(): Promise<void> {
    await loadRoleHierarchy();
    setupRoleTreeEvents();
}

/**
 * 加载角色层次结构
 */
async function loadRoleHierarchy(): Promise<void> {
    try {
        const response = await RoleService.getRoleHierarchy();
        
        if (response.success && response.data?.hierarchy) {
            const hierarchy = response.data.hierarchy;
            const allRoles = await getAllRolesFlat();
            
            updateRoleStatistics(allRoles, hierarchy);
            renderRoleHierarchy(hierarchy);
        } else {
            showNoRolesMessage();
        }
    } catch (error) {
        console.error('Error loading role hierarchy:', error);
        (window as any).notificationService?.error('加载角色层次结构失败');
        showNoRolesMessage();
    }
}

/**
 * 获取所有角色的扁平列表
 */
async function getAllRolesFlat(): Promise<Role[]> {
    try {
        const response = await RoleService.getAllRoles();
        return response.success && response.data?.roles ? response.data.roles : [];
    } catch (error) {
        console.error('Error getting all roles:', error);
        return [];
    }
}

/**
 * 更新角色统计信息
 */
function updateRoleStatistics(allRoles: Role[], hierarchy: Role[]): void {
    const totalCount = allRoles.length;
    const rootCount = hierarchy.length;
    const maxDepth = calculateMaxDepth(hierarchy);
    
    const totalCountEl = document.getElementById('total-roles-count');
    const rootCountEl = document.getElementById('root-roles-count');
    const maxDepthEl = document.getElementById('max-depth-count');
    
    if (totalCountEl) totalCountEl.textContent = totalCount.toString();
    if (rootCountEl) rootCountEl.textContent = rootCount.toString();
    if (maxDepthEl) maxDepthEl.textContent = maxDepth.toString();
}

/**
 * 计算层次结构的最大深度
 */
function calculateMaxDepth(roles: Role[], currentDepth: number = 1): number {
    if (!roles.length) return 0;
    
    let maxDepth = currentDepth;
    for (const role of roles) {
        if (role.children && role.children.length > 0) {
            const childDepth = calculateMaxDepth(role.children, currentDepth + 1);
            maxDepth = Math.max(maxDepth, childDepth);
        }
    }
    
    return maxDepth;
}

/**
 * 渲染角色层次结构
 */
function renderRoleHierarchy(hierarchy: Role[]): void {
    const container = document.getElementById('role-hierarchy-container');
    const noRolesMessage = document.getElementById('no-roles-message');
    
    if (!container) return;
    
    if (hierarchy.length === 0) {
        showNoRolesMessage();
        return;
    }
    
    // 隐藏无数据消息
    if (noRolesMessage) {
        noRolesMessage.classList.add('hidden');
    }
    
    // 转换为树节点格式
    const treeNodes = convertToTreeNodes(hierarchy, 0);
    
    // 渲染树
    container.innerHTML = treeNodes.map(node => renderRoleTreeNode(node)).join('');
}

/**
 * 转换为树节点格式
 */
function convertToTreeNodes(roles: Role[], depth: number): RoleTreeNode[] {
    return roles.map(role => ({
        ...role,
        children: role.children ? convertToTreeNodes(role.children, depth + 1) : [],
        expanded: depth < 2, // 默认展开前两层
        depth
    }));
}

/**
 * 渲染单个角色树节点
 */
function renderRoleTreeNode(node: RoleTreeNode): string {
    const hasChildren = node.children && node.children.length > 0;
    const indent = node.depth * 24; // 每层缩进24px
    const levelColor = RoleUtils.getRoleColor(node.level);
    const levelIcon = RoleUtils.getRoleIcon(node.level);
    
    return `
        <div class="role-tree-node" data-role-code="${node.code}">
            <div class="flex items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all duration-200" 
                 style="margin-left: ${indent}px;">
                
                <!-- 展开/收起按钮 -->
                <div class="w-6 h-6 flex items-center justify-center mr-2">
                    ${hasChildren ? `
                        <button class="expand-toggle text-gray-400 hover:text-gray-600 transition-colors" 
                                data-expanded="${node.expanded}">
                            <i class="fas fa-chevron-${node.expanded ? 'down' : 'right'} text-xs"></i>
                        </button>
                    ` : ''}
                </div>
                
                <!-- 角色图标 -->
                <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3" 
                     style="background-color: ${levelColor}20; color: ${levelColor};">
                    <i class="${levelIcon} text-sm"></i>
                </div>
                
                <!-- 角色信息 -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900">${node.display_name}</span>
                        <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">${node.code}</span>
                        <span class="text-xs text-white px-2 py-1 rounded" style="background-color: ${levelColor};">
                            Level ${node.level}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1 truncate">${node.description || '无描述'}</p>
                </div>
                
                <!-- 操作按钮 -->
                <div class="flex items-center space-x-2 ml-4">
                    <button class="btn btn-sm btn-secondary opacity-0 group-hover:opacity-100 transition-opacity" 
                            onclick="showRoleDetails('${node.code}')" title="查看详情">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary opacity-0 group-hover:opacity-100 transition-opacity" 
                            onclick="showEditRoleModal('${node.code}')" title="编辑角色">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-success opacity-0 group-hover:opacity-100 transition-opacity" 
                            onclick="showCreateRoleModal('${node.code}')" title="添加子角色">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-danger opacity-0 group-hover:opacity-100 transition-opacity" 
                            onclick="deleteRole('${node.code}')" title="删除角色">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <!-- 子节点 -->
            ${hasChildren ? `
                <div class="children-container ${node.expanded ? '' : 'hidden'}">
                    ${node.children.map(child => renderRoleTreeNode(child)).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * 显示无角色消息
 */
function showNoRolesMessage(): void {
    const container = document.getElementById('role-hierarchy-container');
    const noRolesMessage = document.getElementById('no-roles-message');
    
    if (container) {
        container.innerHTML = '';
    }
    
    if (noRolesMessage) {
        noRolesMessage.classList.remove('hidden');
    }
}

/**
 * 设置角色树事件监听
 */
function setupRoleTreeEvents(): void {
    const container = document.getElementById('role-hierarchy-container');
    if (!container) return;
    
    // 展开/收起事件
    container.addEventListener('click', (e) => {
        const expandBtn = (e.target as HTMLElement).closest('.expand-toggle') as HTMLElement;
        if (expandBtn) {
            e.stopPropagation();
            toggleRoleNode(expandBtn);
        }
    });
    
    // 悬停效果
    container.addEventListener('mouseover', (e) => {
        const node = (e.target as HTMLElement).closest('.role-tree-node');
        if (node) {
            node.classList.add('group');
        }
    });
    
    container.addEventListener('mouseout', (e) => {
        const node = (e.target as HTMLElement).closest('.role-tree-node');
        if (node) {
            node.classList.remove('group');
        }
    });
}

/**
 * 切换角色节点展开/收起状态
 */
function toggleRoleNode(expandBtn: HTMLElement): void {
    const isExpanded = expandBtn.dataset.expanded === 'true';
    const newExpanded = !isExpanded;
    
    // 更新按钮状态
    expandBtn.dataset.expanded = newExpanded.toString();
    const icon = expandBtn.querySelector('i');
    if (icon) {
        icon.className = `fas fa-chevron-${newExpanded ? 'down' : 'right'} text-xs`;
    }
    
    // 切换子节点容器显示
    const node = expandBtn.closest('.role-tree-node');
    const childrenContainer = node?.querySelector('.children-container');
    if (childrenContainer) {
        if (newExpanded) {
            childrenContainer.classList.remove('hidden');
        } else {
            childrenContainer.classList.add('hidden');
        }
    }
}

/**
 * 展开所有角色节点
 */
function expandAllRoles(): void {
    const expandBtns = document.querySelectorAll('.expand-toggle');
    expandBtns.forEach(btn => {
        const expandBtn = btn as HTMLElement;
        if (expandBtn.dataset.expanded !== 'true') {
            toggleRoleNode(expandBtn);
        }
    });
}

/**
 * 收起所有角色节点
 */
function collapseAllRoles(): void {
    const expandBtns = document.querySelectorAll('.expand-toggle');
    expandBtns.forEach(btn => {
        const expandBtn = btn as HTMLElement;
        if (expandBtn.dataset.expanded === 'true') {
            toggleRoleNode(expandBtn);
        }
    });
}

/**
 * 显示角色详情
 */
async function showRoleDetails(roleCode: string): Promise<void> {
    try {
        const allRoles = await getAllRolesFlat();
        const role = allRoles.find(r => r.code === roleCode);
        
        if (!role) {
            (window as any).notificationService?.error('角色不存在');
            return;
        }
        
        const panel = document.getElementById('role-details-panel');
        const content = document.getElementById('role-details-content');
        
        if (!panel || !content) return;
        
        // 获取父角色和子角色信息
        const parentRole = role.parent_code ? allRoles.find(r => r.code === role.parent_code) : null;
        const childRoles = allRoles.filter(r => r.parent_code === role.code);
        const roleHierarchyPath = RoleUtils.getRoleDisplayPath(role.code, allRoles);
        
        content.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                    <h4 class="font-medium text-gray-900">基本信息</h4>
                    <div class="space-y-3">
                        <div class="flex items-center">
                            <span class="text-gray-500 w-20">代码:</span>
                            <span class="font-mono bg-gray-100 px-2 py-1 rounded text-sm">${role.code}</span>
                        </div>
                        <div class="flex items-center">
                            <span class="text-gray-500 w-20">名称:</span>
                            <span class="font-medium">${role.display_name}</span>
                        </div>
                        <div class="flex items-center">
                            <span class="text-gray-500 w-20">级别:</span>
                            <span class="text-xs text-white px-2 py-1 rounded" style="background-color: ${RoleUtils.getRoleColor(role.level)};">
                                Level ${role.level}
                            </span>
                        </div>
                        <div class="flex items-start">
                            <span class="text-gray-500 w-20">描述:</span>
                            <span class="flex-1">${role.description || '无描述'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <h4 class="font-medium text-gray-900">层次关系</h4>
                    <div class="space-y-3">
                        <div class="flex items-start">
                            <span class="text-gray-500 w-20">路径:</span>
                            <span class="flex-1 text-sm">${roleHierarchyPath}</span>
                        </div>
                        <div class="flex items-center">
                            <span class="text-gray-500 w-20">父角色:</span>
                            ${parentRole ? `
                                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                    ${parentRole.display_name}
                                </span>
                            ` : '<span class="text-gray-400 text-sm">无父角色</span>'}
                        </div>
                        <div class="flex items-start">
                            <span class="text-gray-500 w-20">子角色:</span>
                            <div class="flex-1">
                                ${childRoles.length > 0 ? `
                                    <div class="flex flex-wrap gap-1">
                                        ${childRoles.map(child => `
                                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                                ${child.display_name}
                                            </span>
                                        `).join('')}
                                    </div>
                                ` : '<span class="text-gray-400 text-sm">无子角色</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button class="btn btn-secondary" onclick="hideRoleDetails()">关闭</button>
                <button class="btn btn-primary" onclick="showEditRoleModal('${role.code}')">
                    <i class="fas fa-edit mr-2"></i>编辑角色
                </button>
            </div>
        `;
        
        panel.classList.remove('hidden');
        panel.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error showing role details:', error);
        (window as any).notificationService?.error('获取角色详情失败');
    }
}

/**
 * 隐藏角色详情面板
 */
function hideRoleDetails(): void {
    const panel = document.getElementById('role-details-panel');
    if (panel) {
        panel.classList.add('hidden');
    }
}

/**
 * 显示创建角色模态框
 */
async function showCreateRoleModal(parentCode?: string): Promise<void> {
    const modal = await createRoleFormModal('create', undefined, parentCode);
    document.body.appendChild(modal);
    setupRoleFormModal(modal, 'create');
}

/**
 * 显示编辑角色模态框
 */
async function showEditRoleModal(roleCode: string): Promise<void> {
    try {
        const allRoles = await getAllRolesFlat();
        const role = allRoles.find(r => r.code === roleCode);
        
        if (!role) {
            (window as any).notificationService?.error('角色不存在');
            return;
        }
        
        const modal = await createRoleFormModal('edit', role);
        document.body.appendChild(modal);
        setupRoleFormModal(modal, 'edit', role);
        
    } catch (error) {
        console.error('Error showing edit role modal:', error);
        (window as any).notificationService?.error('获取角色信息失败');
    }
}

/**
 * 创建角色表单模态框
 */
async function createRoleFormModal(mode: 'create' | 'edit', role?: Role, parentCode?: string): Promise<HTMLElement> {
    const allRoles = await getAllRolesFlat();
    const isEdit = mode === 'edit' && role;
    
    // 生成父角色选项
    let parentOptions = '<option value="">无父角色（顶级角色）</option>';
    if (mode === 'create') {
        // 创建模式：显示所有角色作为潜在父角色
        const availableParents = allRoles.filter(r => r.code !== role?.code);
        parentOptions += availableParents
            .map(r => `<option value="${r.code}" ${r.code === parentCode ? 'selected' : ''}>${r.display_name} (Level ${r.level})</option>`)
            .join('');
    } else if (isEdit) {
        // 编辑模式：排除自己和自己的后代作为父角色
        const descendantCodes = RoleUtils.getChildRoleCodes(role.code, allRoles);
        const availableParents = allRoles.filter(r => 
            r.code !== role.code && !descendantCodes.includes(r.code)
        );
        parentOptions += availableParents
            .map(r => `<option value="${r.code}" ${r.code === role.parent_code ? 'selected' : ''}>${r.display_name} (Level ${r.level})</option>`)
            .join('');
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'role-form-modal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-semibold text-gray-900">
                    ${isEdit ? '编辑角色' : '创建新角色'}
                </h3>
                <button type="button" class="text-gray-400 hover:text-gray-600" id="close-modal-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="role-form" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">角色代码 <span class="text-red-500">*</span></label>
                        <input type="text" 
                               id="role-code" 
                               name="code" 
                               class="form-input" 
                               placeholder="role_code" 
                               value="${isEdit ? role.code : ''}"
                               ${isEdit ? 'readonly' : ''}
                               required>
                        <small class="text-gray-500 text-xs mt-1">
                            ${isEdit ? '角色代码不可修改' : '英文字母、数字和下划线，唯一标识'}
                        </small>
                    </div>
                    
                    <div>
                        <label class="form-label">显示名称 <span class="text-red-500">*</span></label>
                        <input type="text" 
                               id="role-display-name" 
                               name="display_name" 
                               class="form-input" 
                               placeholder="角色显示名称" 
                               value="${isEdit ? role.display_name : ''}"
                               required>
                    </div>
                </div>
                
                <div>
                    <label class="form-label">角色描述</label>
                    <textarea id="role-description" 
                              name="description" 
                              class="form-input" 
                              rows="3" 
                              placeholder="描述角色的用途和权限">${isEdit ? role.description : ''}</textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">权限级别 <span class="text-red-500">*</span></label>
                        <input type="number" 
                               id="role-level" 
                               name="level" 
                               class="form-input" 
                               placeholder="0" 
                               value="${isEdit ? role.level : ''}"
                               min="0" 
                               max="100" 
                               required>
                        <small class="text-gray-500 text-xs mt-1">
                            数值越小权限越高，0为最高权限
                        </small>
                    </div>
                    
                    <div>
                        <label class="form-label">父角色</label>
                        <select id="role-parent" name="parent_code" class="form-select">
                            ${parentOptions}
                        </select>
                        <small class="text-gray-500 text-xs mt-1">
                            选择父角色建立层次关系
                        </small>
                    </div>
                </div>
                
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 class="font-medium text-blue-900 mb-2">
                        <i class="fas fa-info-circle mr-2"></i>层次关系说明
                    </h4>
                    <ul class="text-sm text-blue-800 space-y-1">
                        <li>• 子角色继承父角色的所有权限</li>
                        <li>• 权限级别必须大于父角色级别</li>
                        <li>• 删除角色会同时删除其所有子角色</li>
                        <li>• 顶级角色没有父角色</li>
                    </ul>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button type="button" class="btn btn-secondary" id="cancel-btn">取消</button>
                    <button type="submit" class="btn btn-primary" id="submit-btn">
                        <i class="fas fa-save mr-2"></i>
                        ${isEdit ? '更新角色' : '创建角色'}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    return modal;
}

/**
 * 设置角色表单模态框事件
 */
function setupRoleFormModal(modal: HTMLElement, mode: 'create' | 'edit', role?: Role): void {
    const closeBtn = modal.querySelector('#close-modal-btn') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement;
    const form = modal.querySelector('#role-form') as HTMLFormElement;
    
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
    
    // 表单提交事件
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleRoleFormSubmit(form, mode, role, closeModal);
    });
    
    // 父角色变化时自动调整级别
    const parentSelect = modal.querySelector('#role-parent') as HTMLSelectElement;
    const levelInput = modal.querySelector('#role-level') as HTMLInputElement;
    
    parentSelect?.addEventListener('change', async () => {
        const parentCode = parentSelect.value;
        if (parentCode && levelInput) {
            const allRoles = await getAllRolesFlat();
            const parentRole = allRoles.find(r => r.code === parentCode);
            if (parentRole) {
                const suggestedLevel = parentRole.level + 10;
                levelInput.value = suggestedLevel.toString();
                levelInput.min = (parentRole.level + 1).toString();
            } else {
                levelInput.min = '0';
            }
        } else if (levelInput) {
            levelInput.min = '0';
        }
    });
}

/**
 * 处理角色表单提交
 */
async function handleRoleFormSubmit(
    form: HTMLFormElement, 
    mode: 'create' | 'edit', 
    role?: Role, 
    closeModal?: () => void
): Promise<void> {
    try {
        const formData = new FormData(form);
        const submitBtn = form.querySelector('#submit-btn') as HTMLButtonElement;
        
        // 显示加载状态
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>处理中...';
        submitBtn.disabled = true;
        
        const roleData: RoleFormData = {
            code: formData.get('code') as string,
            display_name: formData.get('display_name') as string,
            description: formData.get('description') as string || '',
            level: parseInt(formData.get('level') as string),
            parent_code: formData.get('parent_code') as string || undefined
        };
        
        // 验证数据
        if (!roleData.code || !roleData.display_name || isNaN(roleData.level)) {
            (window as any).notificationService?.error('请填写所有必填字段');
            return;
        }
        
        let response;
        if (mode === 'create') {
            response = await RoleService.createRole(roleData);
        } else {
            response = await RoleService.updateRole(role!.code, {
                display_name: roleData.display_name,
                description: roleData.description,
                level: roleData.level,
                parent_code: roleData.parent_code
            });
        }
        
        if (response.success) {
            (window as any).notificationService?.success(
                mode === 'create' ? '角色创建成功' : '角色更新成功'
            );
            
            // 刷新页面数据
            await refreshRoleHierarchy();
            
            // 关闭模态框
            closeModal?.();
        } else {
            (window as any).notificationService?.error(
                response.message || (mode === 'create' ? '角色创建失败' : '角色更新失败')
            );
        }
        
    } catch (error) {
        console.error('Error submitting role form:', error);
        (window as any).notificationService?.error('操作失败，请稍后重试');
    } finally {
        // 恢复按钮状态
        const submitBtn = form.querySelector('#submit-btn') as HTMLButtonElement;
        if (submitBtn) {
            const isEdit = mode === 'edit';
            submitBtn.innerHTML = `<i class="fas fa-save mr-2"></i>${isEdit ? '更新角色' : '创建角色'}`;
            submitBtn.disabled = false;
        }
    }
}

/**
 * 删除角色
 */
async function deleteRole(roleCode: string): Promise<void> {
    try {
        const allRoles = await getAllRolesFlat();
        const role = allRoles.find(r => r.code === roleCode);
        
        if (!role) {
            (window as any).notificationService?.error('角色不存在');
            return;
        }
        
        // 检查是否有子角色
        const childRoles = allRoles.filter(r => r.parent_code === roleCode);
        
        let confirmMessage = `确定要删除角色"${role.display_name}"吗？`;
        if (childRoles.length > 0) {
            confirmMessage += `\n\n注意：这将同时删除以下子角色：\n${childRoles.map(r => `• ${r.display_name}`).join('\n')}`;
        }
        confirmMessage += '\n\n此操作不可撤销。';
        
        if (confirm(confirmMessage)) {
            const response = await RoleService.deleteRole(roleCode);
            
            if (response.success) {
                (window as any).notificationService?.success('角色删除成功');
                
                // 关闭详情面板（如果正在显示被删除的角色）
                const detailsPanel = document.getElementById('role-details-panel');
                if (detailsPanel && !detailsPanel.classList.contains('hidden')) {
                    const currentRoleCode = detailsPanel.querySelector('[onclick*="showEditRoleModal"]')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
                    if (currentRoleCode === roleCode) {
                        hideRoleDetails();
                    }
                }
                
                // 刷新页面数据
                await refreshRoleHierarchy();
            } else {
                (window as any).notificationService?.error(
                    response.message || '角色删除失败'
                );
            }
        }
        
    } catch (error) {
        console.error('Error deleting role:', error);
        (window as any).notificationService?.error('删除角色失败');
    }
}

/**
 * 刷新角色层次结构
 */
async function refreshRoleHierarchy(): Promise<void> {
    await loadRoleHierarchy();
}

// 导出全局函数
(window as any).showCreateRoleModal = showCreateRoleModal;
(window as any).showEditRoleModal = showEditRoleModal;
(window as any).showRoleDetails = showRoleDetails;
(window as any).hideRoleDetails = hideRoleDetails;
(window as any).deleteRole = deleteRole;
(window as any).expandAllRoles = expandAllRoles;
(window as any).collapseAllRoles = collapseAllRoles;
(window as any).refreshRoleHierarchy = refreshRoleHierarchy;
