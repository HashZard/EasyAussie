/**
 * 表单管理页面内容 - TypeScript版本
 */

export interface FormData {
    id: string;
    title: string;
    type: 'inspection' | 'airportPickup' | 'rentalApplication' | 'coverletter' | 'test';
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    submittedBy: string;
    submittedAt: string;
    lastModified: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface FormFilters {
    search: string;
    status: 'all' | 'draft' | 'pending' | 'approved' | 'rejected';
    type: 'all' | 'inspection' | 'airportPickup' | 'rentalApplication' | 'coverletter' | 'test';
    priority: 'all' | 'low' | 'medium' | 'high' | 'urgent';
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}

/**
 * 获取表单列表数据
 */
export async function getFormsList(filters: FormFilters, page: number = 1): Promise<{ forms: FormData[], pagination: PaginationInfo }> {
    // 实际应用中这里会调用API
    const mockForms: FormData[] = [
        {
            id: '1',
            title: '房屋检查申请',
            type: 'inspection',
            status: 'pending',
            submittedBy: 'user1@example.com',
            submittedAt: '2024-08-01T10:30:00Z',
            lastModified: '2024-08-01T10:30:00Z',
            priority: 'high'
        },
        {
            id: '2',
            title: '机场接送申请',
            type: 'airportPickup',
            status: 'approved',
            submittedBy: 'user2@example.com',
            submittedAt: '2024-07-28T14:22:00Z',
            lastModified: '2024-07-30T09:15:00Z',
            priority: 'medium'
        },
        {
            id: '3',
            title: '租房申请表',
            type: 'rentalApplication',
            status: 'draft',
            submittedBy: 'user3@example.com',
            submittedAt: '2024-07-25T11:18:00Z',
            lastModified: '2024-08-02T16:45:00Z',
            priority: 'urgent'
        },
        {
            id: '4',
            title: '求职信申请',
            type: 'coverletter',
            status: 'rejected',
            submittedBy: 'user4@example.com',
            submittedAt: '2024-07-20T13:20:00Z',
            lastModified: '2024-07-22T10:30:00Z',
            priority: 'low'
        },
        {
            id: '5',
            title: '测试服务申请',
            type: 'test',
            status: 'pending',
            submittedBy: 'user5@example.com',
            submittedAt: '2024-08-03T09:15:00Z',
            lastModified: '2024-08-03T09:15:00Z',
            priority: 'low'
        }
    ];

    return {
        forms: mockForms,
        pagination: {
            currentPage: page,
            totalPages: 1,
            totalItems: mockForms.length,
            itemsPerPage: 10
        }
    };
}

/**
 * 获取表单类型显示名称
 */
export function getFormTypeDisplayName(type: FormData['type']): string {
    const typeMap: Record<FormData['type'], string> = {
        'inspection': '房屋检查',
        'airportPickup': '机场接送',
        'rentalApplication': '租房申请',
        'coverletter': '求职信',
        'test': '测试服务'
    };
    return typeMap[type] || '未知类型';
}

/**
 * 获取状态显示名称和样式
 */
export function getStatusDisplay(status: FormData['status']): { label: string; className: string } {
    const statusMap = {
        'draft': { label: '草稿', className: 'status-badge status-gray' },
        'pending': { label: '待审核', className: 'status-badge status-warning' },
        'approved': { label: '已通过', className: 'status-badge status-success' },
        'rejected': { label: '已拒绝', className: 'status-badge status-error' }
    };
    return statusMap[status];
}

/**
 * 获取优先级显示名称和样式
 */
export function getPriorityDisplay(priority: FormData['priority']): { label: string; className: string } {
    const priorityMap = {
        'low': { label: '低', className: 'status-badge status-gray' },
        'medium': { label: '中', className: 'status-badge status-info' },
        'high': { label: '高', className: 'status-badge status-warning' },
        'urgent': { label: '紧急', className: 'status-badge status-error' }
    };
    return priorityMap[priority];
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
 * 生成桌面端表单表格HTML
 */
function generateDesktopFormTable(forms: FormData[]): string {
    return `
        <div class="hidden md:block">
            <table class="responsive-table">
                <thead>
                    <tr>
                        <th>表单信息</th>
                        <th>类型</th>
                        <th>状态</th>
                        <th>优先级</th>
                        <th>提交时间</th>
                        <th>最后修改</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${forms.map(form => `
                        <tr>
                            <td>
                                <div>
                                    <div class="text-sm font-medium text-gray-900">${form.title}</div>
                                    <div class="text-sm text-gray-500">提交人: ${form.submittedBy}</div>
                                </div>
                            </td>
                            <td>
                                <span class="status-badge status-info">${getFormTypeDisplayName(form.type)}</span>
                            </td>
                            <td>
                                <span class="${getStatusDisplay(form.status).className}">${getStatusDisplay(form.status).label}</span>
                            </td>
                            <td>
                                <span class="${getPriorityDisplay(form.priority).className}">${getPriorityDisplay(form.priority).label}</span>
                            </td>
                            <td class="text-sm text-gray-900">${formatDate(form.submittedAt)}</td>
                            <td class="text-sm text-gray-900">${formatDate(form.lastModified)}</td>
                            <td>
                                <div class="flex items-center space-x-2">
                                    <button class="btn btn-sm btn-secondary" data-action="view" data-form-id="${form.id}">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-primary" data-action="edit" data-form-id="${form.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    ${form.status === 'pending' ? `
                                        <button class="btn btn-sm btn-success" data-action="approve" data-form-id="${form.id}">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-sm btn-warning" data-action="reject" data-form-id="${form.id}">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    ` : ''}
                                    <button class="btn btn-sm btn-danger" data-action="delete" data-form-id="${form.id}">
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
 * 生成移动端表单列表HTML
 */
function generateMobileFormList(forms: FormData[]): string {
    return `
        <div class="md:hidden mobile-table">
            ${forms.map(form => `
                <div class="mobile-table-row">
                    <div class="mb-3">
                        <div class="font-medium text-gray-900 mb-1">${form.title}</div>
                        <div class="text-sm text-gray-500">提交人: ${form.submittedBy}</div>
                    </div>
                    
                    <div class="mobile-table-cell">
                        <span class="mobile-table-label">类型</span>
                        <span class="status-badge status-info">${getFormTypeDisplayName(form.type)}</span>
                    </div>
                    
                    <div class="mobile-table-cell">
                        <span class="mobile-table-label">状态</span>
                        <span class="${getStatusDisplay(form.status).className}">${getStatusDisplay(form.status).label}</span>
                    </div>
                    
                    <div class="mobile-table-cell">
                        <span class="mobile-table-label">优先级</span>
                        <span class="${getPriorityDisplay(form.priority).className}">${getPriorityDisplay(form.priority).label}</span>
                    </div>
                    
                    <div class="mobile-table-cell">
                        <span class="mobile-table-label">提交时间</span>
                        <span class="mobile-table-value">${formatDate(form.submittedAt)}</span>
                    </div>
                    
                    <div class="mobile-table-cell">
                        <span class="mobile-table-label">最后修改</span>
                        <span class="mobile-table-value">${formatDate(form.lastModified)}</span>
                    </div>
                    
                    <div class="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-200">
                        <button class="btn btn-sm btn-secondary" data-action="view" data-form-id="${form.id}">查看</button>
                        <button class="btn btn-sm btn-primary" data-action="edit" data-form-id="${form.id}">编辑</button>
                        ${form.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" data-action="approve" data-form-id="${form.id}">通过</button>
                            <button class="btn btn-sm btn-warning" data-action="reject" data-form-id="${form.id}">拒绝</button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * 获取表单管理页面内容
 */
export async function getFormsPageContent(): Promise<string> {
    const defaultFilters: FormFilters = { search: '', status: 'all', type: 'all', priority: 'all' };
    const { forms, pagination } = await getFormsList(defaultFilters, 1);

    return `
        <div class="space-y-4 lg:space-y-6 fade-in">
            <!-- 页面标题和操作 -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-lg lg:text-xl font-semibold text-gray-900">表单管理</h1>
                    <p class="text-sm text-gray-600">管理所有用户提交的表单</p>
                </div>
                <div class="flex flex-col sm:flex-row gap-2">
                    <button class="btn btn-secondary" id="export-forms-btn">
                        <i class="fas fa-download mr-2"></i>
                        导出数据
                    </button>
                    <button class="btn btn-primary" id="add-form-btn">
                        <i class="fas fa-plus mr-2"></i>
                        新建表单
                    </button>
                </div>
            </div>

            <!-- 搜索和筛选 -->
            <div class="card">
                <div class="card-body">
                    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div class="lg:col-span-2">
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i class="fas fa-search text-gray-400"></i>
                                </div>
                                <input type="text" 
                                       id="search-input"
                                       placeholder="搜索表单..." 
                                       class="form-input pl-10">
                            </div>
                        </div>
                        <div>
                            <select id="status-filter" class="form-select">
                                <option value="all">所有状态</option>
                                <option value="draft">草稿</option>
                                <option value="pending">待审核</option>
                                <option value="approved">已通过</option>
                                <option value="rejected">已拒绝</option>
                            </select>
                        </div>
                        <div>
                            <select id="type-filter" class="form-select">
                                <option value="all">所有类型</option>
                                <option value="inspection">房屋检查</option>
                                <option value="transfer">学校转学</option>
                                <option value="application">签证申请</option>
                                <option value="other">其他服务</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 表单列表 -->
            <div class="card">
                <div class="card-header">
                    <h2 class="text-lg font-medium text-gray-900">表单列表</h2>
                    <p class="text-sm text-gray-500 mt-1">共 ${pagination.totalItems} 个表单</p>
                </div>
                <div class="card-body p-0">
                    <div id="forms-table-container">
                        ${generateDesktopFormTable(forms)}
                        ${generateMobileFormList(forms)}
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
 * 初始化表单管理页面
 */
export async function initializeFormsPage(): Promise<void> {
    try {
        // 设置搜索功能
        setupSearch();
        
        // 设置筛选功能
        setupFilters();
        
        // 设置表单操作事件
        setupFormActions();
        
        // 设置分页功能
        setupPagination();
        
        console.log('Forms page initialized with TypeScript');
    } catch (error) {
        console.error('Error initializing forms page:', error);
    }
}

/**
 * 设置搜索功能
 */
function setupSearch(): void {
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (searchInput) {
        let searchTimeout: NodeJS.Timeout;
        
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                await refreshFormsList();
            }, 300);
        });
    }
}

/**
 * 设置筛选功能
 */
function setupFilters(): void {
    const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
    const typeFilter = document.getElementById('type-filter') as HTMLSelectElement;
    
    [statusFilter, typeFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', async () => {
                await refreshFormsList();
            });
        }
    });
}

/**
 * 设置表单操作事件
 */
function setupFormActions(): void {
    const tableContainer = document.getElementById('forms-table-container');
    if (tableContainer) {
        tableContainer.addEventListener('click', handleFormAction);
    }
    
    const addFormBtn = document.getElementById('add-form-btn');
    if (addFormBtn) {
        addFormBtn.addEventListener('click', handleAddForm);
    }
    
    const exportFormsBtn = document.getElementById('export-forms-btn');
    if (exportFormsBtn) {
        exportFormsBtn.addEventListener('click', handleExportForms);
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
 * 处理表单操作
 */
async function handleFormAction(event: Event): Promise<void> {
    const target = event.target as HTMLElement;
    const button = target.closest('[data-action]') as HTMLElement;
    
    if (button) {
        const action = button.dataset.action;
        const formId = button.dataset.formId;
        
        switch (action) {
            case 'view':
                await handleViewForm(formId!);
                break;
            case 'edit':
                await handleEditForm(formId!);
                break;
            case 'approve':
                await handleApproveForm(formId!);
                break;
            case 'reject':
                await handleRejectForm(formId!);
                break;
            case 'delete':
                await handleDeleteForm(formId!);
                break;
        }
    }
}

/**
 * 处理查看表单
 */
async function handleViewForm(formId: string): Promise<void> {
    console.log('查看表单:', formId);
    // 实现查看表单逻辑
}

/**
 * 处理编辑表单
 */
async function handleEditForm(formId: string): Promise<void> {
    console.log('编辑表单:', formId);
    // 实现编辑表单逻辑
}

/**
 * 处理审核通过表单
 */
async function handleApproveForm(formId: string): Promise<void> {
    if (confirm('确定要通过这个表单吗？')) {
        console.log('通过表单:', formId);
        // 实现通过表单逻辑
        await refreshFormsList();
    }
}

/**
 * 处理拒绝表单
 */
async function handleRejectForm(formId: string): Promise<void> {
    if (confirm('确定要拒绝这个表单吗？')) {
        console.log('拒绝表单:', formId);
        // 实现拒绝表单逻辑
        await refreshFormsList();
    }
}

/**
 * 处理删除表单
 */
async function handleDeleteForm(formId: string): Promise<void> {
    if (confirm('确定要删除这个表单吗？')) {
        console.log('删除表单:', formId);
        // 实现删除表单逻辑
        await refreshFormsList();
    }
}

/**
 * 处理添加表单
 */
function handleAddForm(): void {
    console.log('添加新表单');
    // 实现添加表单逻辑
}

/**
 * 处理导出表单
 */
function handleExportForms(): void {
    console.log('导出表单数据');
    // 实现导出表单逻辑
}

/**
 * 处理分页点击
 */
async function handlePaginationClick(event: Event): Promise<void> {
    const target = event.target as HTMLElement;
    const button = target.closest('[data-page]') as HTMLElement;
    
    if (button && !button.hasAttribute('disabled')) {
        const page = parseInt(button.dataset.page!);
        await refreshFormsList(page);
    }
}

/**
 * 获取当前筛选条件
 */
function getCurrentFilters(): FormFilters {
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
    const typeFilter = document.getElementById('type-filter') as HTMLSelectElement;
    
    return {
        search: searchInput?.value || '',
        status: (statusFilter?.value as FormFilters['status']) || 'all',
        type: (typeFilter?.value as FormFilters['type']) || 'all',
        priority: 'all' // 可以后续添加优先级筛选
    };
}

/**
 * 刷新表单列表
 */
async function refreshFormsList(page: number = 1): Promise<void> {
    try {
        const filters = getCurrentFilters();
        const { forms, pagination } = await getFormsList(filters, page);
        
        const tableContainer = document.getElementById('forms-table-container');
        const paginationContainer = document.getElementById('pagination-container');
        
        if (tableContainer) {
            tableContainer.innerHTML = generateDesktopFormTable(forms) + generateMobileFormList(forms);
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
        setupFormActions();
        setupPagination();
        
    } catch (error) {
        console.error('Error refreshing forms list:', error);
    }
}
