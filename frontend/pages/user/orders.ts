/**
 * 用户订单页面内容 - TypeScript版本
 */

import { httpClient } from '../../src/services/http-client';

export interface Order {
    id: string;
    email: string;
    formType: 'inspection' | 'airportPickup' | 'rentalApplication' | 'coverletter' | 'test';
    formData: string; // JSON字符串，需要前端解析
    files?: string;
    remark?: string;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt?: string;
}

export interface OrderFilters {
    search: string;
    status: 'all' | 'pending' | 'processing' | 'completed' | 'cancelled';
    type: 'all' | 'inspection' | 'airportPickup' | 'rentalApplication' | 'coverletter' | 'test';
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext?: boolean;
    hasPrev?: boolean;
}

/**
 * 获取订单列表数据
 */
export async function getUserOrders(filters: OrderFilters, page: number = 1): Promise<{ orders: Order[], pagination: PaginationInfo }> {
    try {
        // 构建查询参数
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: '10'
        });
        
        if (filters.status && filters.status !== 'all') {
            params.append('status', filters.status);
        }
        
        if (filters.type && filters.type !== 'all') {
            params.append('type', filters.type);
        }
        
        if (filters.search && filters.search.trim()) {
            params.append('search', filters.search.trim());
        }
        
        // 调用API
        const response = await httpClient.get<any>(`/api/orders?${params.toString()}`);
        
        if (response.success && response.data) {
            // httpClient现在会自动处理嵌套数据结构
            return {
                orders: response.data.data || response.data,
                pagination: {
                    currentPage: response.data.pagination?.currentPage || 1,
                    totalPages: response.data.pagination?.totalPages || 1,
                    totalItems: response.data.pagination?.totalItems || 0,
                    itemsPerPage: response.data.pagination?.itemsPerPage || 10,
                    hasNext: response.data.pagination?.hasNext || false,
                    hasPrev: response.data.pagination?.hasPrev || false
                }
            };
        }
        
        // 如果API调用失败，返回空结果
        return {
            orders: [],
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 10
            }
        };
        
    } catch (error) {
        console.error('Error fetching orders:', error);
        
        // 发生错误时返回空结果
        return {
            orders: [],
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
 * 获取订单统计数据
 */
export async function getOrderStats(): Promise<{
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    processingOrders: number;
    cancelledOrders: number;
    totalSpent: number;
}> {
    try {
        const response = await httpClient.get<any>('/api/orders/stats');
        
        if (response.success && response.data) {
            // httpClient现在会自动处理嵌套数据结构
            return response.data;
        }
        
        // 如果API调用失败，返回默认值
        return {
            totalOrders: 0,
            completedOrders: 0,
            pendingOrders: 0,
            processingOrders: 0,
            cancelledOrders: 0,
            totalSpent: 0
        };
        
    } catch (error) {
        console.error('Error fetching order stats:', error);
        return {
            totalOrders: 0,
            completedOrders: 0,
            pendingOrders: 0,
            processingOrders: 0,
            cancelledOrders: 0,
            totalSpent: 0
        };
    }
}

/**
 * 获取订单详情
 */
export async function getOrderDetail(orderId: string): Promise<Order | null> {
    try {
        const response = await httpClient.get<any>(`/api/orders/${orderId}`);
        
        if (response.success && response.data) {
            // httpClient现在会自动处理嵌套数据结构
            return response.data;
        }
        
        return null;
        
    } catch (error) {
        console.error('Error fetching order detail:', error);
        return null;
    }
}

/**
 * 取消订单
 */
export async function cancelOrder(orderId: string): Promise<boolean> {
    try {
        const response = await httpClient.post<any>(`/api/orders/${orderId}/cancel`);
        
        if (response.success && response.data) {
            // httpClient现在会自动处理嵌套数据结构
            return response.data.success || response.success;
        }
        
        return false;
        
    } catch (error) {
        console.error('Error cancelling order:', error);
        return false;
    }
}

/**
 * 根据表单类型和数据生成订单标题
 */
function generateOrderTitle(order: Order): string {
    const typeMap: Record<Order['formType'], string> = {
        'inspection': '房屋检查服务',
        'airportPickup': '机场接送服务',
        'rentalApplication': '租房申请服务',
        'coverletter': '求职信服务',
        'test': '测试服务'
    };
    
    const baseTitle = typeMap[order.formType] || '服务订单';
    
    try {
        const data = JSON.parse(order.formData);
        
        // 根据表单类型生成更具体的标题
        if (order.formType === 'inspection' && data.address) {
            return `房屋检查 - ${data.address}`;
        } else if (order.formType === 'airportPickup') {
            if (data.pickupLocation || data.dropoffLocation) {
                const pickup = data.pickupLocation || '未知地点';
                const dropoff = data.dropoffLocation || '未知地点';
                return `机场接送 - ${pickup} → ${dropoff}`;
            }
        } else if (order.formType === 'rentalApplication' && data.propertyAddress) {
            return `租房申请 - ${data.propertyAddress}`;
        } else if (order.formType === 'coverletter' && data.position) {
            return `求职信 - ${data.position}`;
        }
    } catch (error) {
        // 解析失败，使用基础标题
    }
    
    return baseTitle;
}

/**
 * 获取订单类型显示名称
 */
export function getOrderTypeDisplayName(formType: Order['formType']): string {
    const typeMap: Record<Order['formType'], string> = {
        'inspection': '房屋检查',
        'airportPickup': '机场接送',
        'rentalApplication': '租房申请',
        'coverletter': '求职信',
        'test': '测试服务'
    };
    return typeMap[formType] || '未知类型';
}

/**
 * 获取状态显示名称和样式
 */
export function getStatusDisplay(status: Order['status']): { label: string; className: string } {
    const statusMap = {
        'pending': { label: '待处理', className: 'status-badge status-warning' },
        'processing': { label: '处理中', className: 'status-badge status-info' },
        'completed': { label: '已完成', className: 'status-badge status-success' },
        'cancelled': { label: '已取消', className: 'status-badge status-error' }
    };
    return statusMap[status];
}

/**
 * 格式化货币显示
 */
export function formatCurrency(amount: number, currency: string = 'AUD'): string {
    const currencySymbols: Record<string, string> = {
        'AUD': 'A$',
        'USD': '$',
        'CNY': '¥'
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
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
 * 生成桌面端订单表格HTML
 */
function generateDesktopOrderTable(orders: Order[]): string {
    return `
        <div class="hidden md:block">
            <table class="responsive-table">
                <thead>
                    <tr>
                        <th>订单信息</th>
                        <th>类型</th>
                        <th>状态</th>
                        <th>创建时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>
                                <div>
                                    <div class="text-sm font-medium text-gray-900">${generateOrderTitle(order)}</div>
                                    <div class="text-sm text-gray-500">订单号: ${order.id}</div>
                                </div>
                            </td>
                            <td>
                                <span class="status-badge status-info">${getOrderTypeDisplayName(order.formType)}</span>
                            </td>
                            <td>
                                <span class="${getStatusDisplay(order.status).className}">${getStatusDisplay(order.status).label}</span>
                            </td>
                            <td class="text-sm text-gray-900">${formatDate(order.createdAt)}</td>
                            <td>
                                <div class="flex items-center space-x-2">
                                    <button class="btn btn-sm btn-secondary" data-action="view" data-order-id="${order.id}">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    ${order.status === 'completed' ? `
                                        <button class="btn btn-sm btn-success" data-action="download" data-order-id="${order.id}">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    ` : ''}
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
 * 生成移动端订单列表HTML
 */
function generateMobileOrderList(orders: Order[]): string {
    return `
        <div class="md:hidden mobile-table">
            ${orders.map(order => `
                <div class="mobile-table-row">
                    <div class="mb-3">
                        <div class="font-medium text-gray-900 mb-1">${generateOrderTitle(order)}</div>
                        <div class="text-sm text-gray-500">订单号: ${order.id}</div>
                    </div>
                    
                    <div class="mobile-table-cell">
                        <span class="mobile-table-label">类型</span>
                        <span class="status-badge status-info">${getOrderTypeDisplayName(order.formType)}</span>
                    </div>
                    
                    <div class="mobile-table-cell">
                        <span class="mobile-table-label">状态</span>
                        <span class="${getStatusDisplay(order.status).className}">${getStatusDisplay(order.status).label}</span>
                    </div>
                    
                    <div class="mobile-table-cell">
                        <span class="mobile-table-label">创建时间</span>
                        <span class="mobile-table-value">${formatDate(order.createdAt)}</span>
                    </div>
                    
                    ${order.remark ? `
                        <div class="mobile-table-cell">
                            <span class="mobile-table-label">备注</span>
                            <span class="mobile-table-value text-xs">${order.remark}</span>
                        </div>
                    ` : ''}
                    
                    <div class="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-200">
                        <button class="btn btn-sm btn-secondary" data-action="view" data-order-id="${order.id}">查看</button>
                        ${order.status === 'completed' ? `
                            <button class="btn btn-sm btn-success" data-action="download" data-order-id="${order.id}">下载</button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * 获取订单页面内容
 */
export async function getOrdersPageContent(): Promise<string> {
    const defaultFilters: OrderFilters = { search: '', status: 'all', type: 'all' };
    const [{ orders, pagination }, stats] = await Promise.all([
        getUserOrders(defaultFilters, 1),
        getOrderStats()
    ]);

    return `
        <div class="space-y-4 lg:space-y-6 fade-in">
            <!-- 订单统计 -->
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div class="card">
                    <div class="card-body text-center">
                        <div class="text-2xl font-bold text-gray-900">${stats.totalOrders}</div>
                        <div class="text-sm text-gray-600">总订单</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body text-center">
                        <div class="text-2xl font-bold text-green-600">${stats.completedOrders}</div>
                        <div class="text-sm text-gray-600">已完成</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body text-center">
                        <div class="text-2xl font-bold text-yellow-600">${stats.pendingOrders}</div>
                        <div class="text-sm text-gray-600">待处理</div>
                    </div>
                </div>
            </div>

            <!-- 搜索和筛选 -->
            <div class="card">
                <div class="card-body">
                    <div class="flex flex-col lg:flex-row gap-4">
                        <div class="flex-1">
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i class="fas fa-search text-gray-400"></i>
                                </div>
                                <input type="text" 
                                       id="search-input"
                                       placeholder="搜索订单..." 
                                       class="form-input pl-10">
                            </div>
                        </div>
                        <div class="flex flex-col sm:flex-row gap-2 lg:gap-4">
                            <select id="status-filter" class="form-select">
                                <option value="all">所有状态</option>
                                <option value="pending">待处理</option>
                                <option value="processing">处理中</option>
                                <option value="completed">已完成</option>
                                <option value="cancelled">已取消</option>
                            </select>
                            <select id="type-filter" class="form-select">
                                <option value="all">所有类型</option>
                                <option value="inspection">房屋检查</option>
                                <option value="transfer">机场接送</option>
                                <option value="application">申请服务</option>
                                <option value="other">其他服务</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 订单列表 -->
            <div class="card">
                <div class="card-header">
                    <h2 class="text-lg font-medium text-gray-900">订单列表</h2>
                    <p class="text-sm text-gray-500 mt-1">共 ${pagination.totalItems} 个订单</p>
                </div>
                <div class="card-body p-0">
                    <div id="orders-table-container">
                        ${generateDesktopOrderTable(orders)}
                        ${generateMobileOrderList(orders)}
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

            <!-- 空状态 -->
            <div id="empty-state" class="hidden text-center py-12">
                <div class="w-24 h-24 mx-auto mb-4 text-gray-300">
                    <i class="fas fa-shopping-cart text-6xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">暂无订单</h3>
                <p class="text-gray-500 mb-6">您还没有创建任何订单</p>
                <a href="/pages/service/service.html" class="btn btn-primary">
                    <i class="fas fa-plus mr-2"></i>
                    创建订单
                </a>
            </div>
        </div>
    `;
}

/**
 * 初始化订单页面
 */
export async function initializeOrdersPage(): Promise<void> {
    try {
        // 设置搜索功能
        setupSearch();
        
        // 设置筛选功能
        setupFilters();
        
        // 设置订单操作事件
        setupOrderActions();
        
        // 设置分页功能
        setupPagination();
        
        // 检查是否显示空状态
        checkEmptyState();
        
        console.log('Orders page initialized with TypeScript');
    } catch (error) {
        console.error('Error initializing orders page:', error);
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
                await refreshOrdersList();
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
                await refreshOrdersList();
            });
        }
    });
}

/**
 * 设置订单操作事件
 */
function setupOrderActions(): void {
    const tableContainer = document.getElementById('orders-table-container');
    if (tableContainer) {
        tableContainer.addEventListener('click', handleOrderAction);
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
 * 处理订单操作
 */
async function handleOrderAction(event: Event): Promise<void> {
    const target = event.target as HTMLElement;
    const button = target.closest('[data-action]') as HTMLElement;
    
    if (button) {
        const action = button.dataset.action;
        const orderId = button.dataset.orderId;
        
        switch (action) {
            case 'view':
                await handleViewOrder(orderId!);
                break;
            case 'download':
                await handleDownloadOrder(orderId!);
                break;
        }
    }
}

/**
 * 显示订单详情模态框
 */
function showOrderDetailModal(order: Order): void {
    const modal = createOrderDetailModal(order);
    document.body.appendChild(modal);
    
    // 显示模态框
    modal.style.display = 'flex';
    
    // 设置事件监听器
    setupOrderDetailModal(modal);
}

/**
 * 解析并格式化表单数据为可读格式
 */
function parseFormData(formData: string, formType: string): string {
    try {
        const data = JSON.parse(formData);
        let html = '<div class="space-y-2">';
        
        // 只处理 inspection 和 airportPickup
        if (formType === 'inspection') {
            // 房屋检查表单
            if (data.wxid) html += `<div><span class="text-gray-500">微信名称:</span> <span class="ml-2">${data.wxid}</span></div>`;
            if (data.name) html += `<div><span class="text-gray-500">预约姓名:</span> <span class="ml-2">${data.name}</span></div>`;
            if (data.address) html += `<div><span class="text-gray-500">房产地址:</span> <span class="ml-2">${data.address}</span></div>`;
            if (data.appointmentDate) html += `<div><span class="text-gray-500">预约时间:</span> <span class="ml-2">${formatDate(data.appointmentDate)}</span></div>`;
            if (data.email) html += `<div><span class="text-gray-500">预约邮箱:</span> <span class="ml-2">${data.email}</span></div>`;
            if (data.phone) html += `<div><span class="text-gray-500">联系电话:</span> <span class="ml-2">${data.phone}</span></div>`;
            
            // 检查清单
            if (data['checklist[]'] && Array.isArray(data['checklist[]']) && data['checklist[]'].length > 0) {
                html += '<div><span class="text-gray-500">检查清单:</span></div>';
                html += '<ul class="ml-4 list-disc">';
                data['checklist[]'].forEach((item: string) => {
                    html += `<li class="text-gray-700">${item}</li>`;
                });
                html += '</ul>';
            }
        } else if (formType === 'airportPickup') {
            // 机场接送表单
            if (data.pickupLocation) html += `<div><span class="text-gray-500">接机地点:</span> <span class="ml-2">${data.pickupLocation}</span></div>`;
            if (data.dropoffLocation) html += `<div><span class="text-gray-500">送达地点:</span> <span class="ml-2">${data.dropoffLocation}</span></div>`;
            if (data.pickupTime) html += `<div><span class="text-gray-500">接机时间:</span> <span class="ml-2">${formatDate(data.pickupTime)}</span></div>`;
            if (data.passengerName) html += `<div><span class="text-gray-500">乘客姓名:</span> <span class="ml-2">${data.passengerName}</span></div>`;
            if (data.flightNumber) html += `<div><span class="text-gray-500">航班号:</span> <span class="ml-2">${data.flightNumber}</span></div>`;
            if (data.contactNumber) html += `<div><span class="text-gray-500">联系电话:</span> <span class="ml-2">${data.contactNumber}</span></div>`;
        } else {
            // 其他类型显示暂不支持详细解析
            html += '<div class="text-gray-500">该表单类型暂不支持详细解析，请联系客服查看详情。</div>';
        }
        
        html += '</div>';
        return html;
    } catch (error) {
        return `<div class="text-red-500">表单数据解析失败: ${error.message}</div>`;
    }
}

/**
 * 创建订单详情模态框
 */
function createOrderDetailModal(order: Order): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'order-detail-modal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">订单详情</h3>
                <button type="button" class="text-gray-400 hover:text-gray-600" id="close-modal-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <!-- 基本信息 -->
                <div class="border-b border-gray-200 pb-4">
                    <h4 class="font-medium text-gray-900 mb-2">基本信息</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-500">订单号:</span>
                            <span class="ml-2 font-medium">${order.id}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">订单类型:</span>
                            <span class="ml-2">${getOrderTypeDisplayName(order.formType)}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">订单状态:</span>
                            <span class="ml-2">
                                <span class="${getStatusDisplay(order.status).className}">${getStatusDisplay(order.status).label}</span>
                            </span>
                        </div>
                        <div>
                            <span class="text-gray-500">创建时间:</span>
                            <span class="ml-2">${formatDate(order.createdAt)}</span>
                        </div>
                        ${order.updatedAt ? `
                        <div>
                            <span class="text-gray-500">更新时间:</span>
                            <span class="ml-2">${formatDate(order.updatedAt)}</span>
                        </div>
                        ` : ''}
                        <div>
                            <span class="text-gray-500">联系方式:</span>
                            <span class="ml-2">${order.email}</span>
                        </div>
                    </div>
                </div>
                
                <!-- 订单标题 -->
                <div class="border-b border-gray-200 pb-4">
                    <h4 class="font-medium text-gray-900 mb-2">订单标题</h4>
                    <p class="text-gray-700">${generateOrderTitle(order)}</p>
                </div>
                
                <!-- 表单数据 -->
                <div class="border-b border-gray-200 pb-4">
                    <h4 class="font-medium text-gray-900 mb-2">表单详情</h4>
                    ${parseFormData(order.formData, order.formType)}
                </div>
                
                <!-- 文件信息 -->
                ${order.files ? `
                <div class="border-b border-gray-200 pb-4">
                    <h4 class="font-medium text-gray-900 mb-2">相关文件</h4>
                    <div class="text-sm text-gray-600">
                        <p>文件信息: ${order.files}</p>
                    </div>
                </div>
                ` : ''}
                
                <!-- 备注信息 -->
                ${order.remark ? `
                <div class="border-b border-gray-200 pb-4">
                    <h4 class="font-medium text-gray-900 mb-2">备注信息</h4>
                    <p class="text-gray-700 whitespace-pre-wrap">${order.remark}</p>
                </div>
                ` : ''}
                
                <!-- 客服联系信息 -->
                <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 class="font-medium text-yellow-800 mb-2">
                        <i class="fas fa-info-circle mr-2"></i>
                        需要取消订单？
                    </h4>
                    <p class="text-yellow-700 mb-2">如需取消订单或有任何疑问，请联系客服：</p>
                    <div class="text-sm text-yellow-700 space-y-1">
                        <div><i class="fab fa-weixin mr-2"></i>微信: EasyAussie_Service</div>
                        <div><i class="fas fa-envelope mr-2"></i>邮箱: service@easyaussie.com</div>
                        <div><i class="fas fa-phone mr-2"></i>电话: +61 412 345 678</div>
                    </div>
                </div>
                
                <!-- 操作按钮 -->
                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" class="btn btn-secondary" id="close-btn">关闭</button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

/**
 * 设置订单详情模态框事件
 */
function setupOrderDetailModal(modal: HTMLElement): void {
    const closeBtn = modal.querySelector('#close-modal-btn') as HTMLButtonElement;
    const closeBtnBottom = modal.querySelector('#close-btn') as HTMLButtonElement;
    
    // 关闭模态框函数
    const closeModal = () => {
        modal.remove();
    };
    
    // 关闭按钮事件
    closeBtn?.addEventListener('click', closeModal);
    closeBtnBottom?.addEventListener('click', closeModal);
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

/**
 * 处理查看订单
 */
async function handleViewOrder(orderId: string): Promise<void> {
    try {
        const orderDetail = await getOrderDetail(orderId);
        
        if (orderDetail) {
            // 创建订单详情模态框
            showOrderDetailModal(orderDetail);
        } else {
            if ((window as any).notificationService) {
                (window as any).notificationService.error('无法获取订单详情');
            }
        }
    } catch (error) {
        console.error('Error viewing order:', error);
        if ((window as any).notificationService) {
            (window as any).notificationService.error('获取订单详情失败');
        }
    }
}

/**
 * 处理下载订单文件
 */
async function handleDownloadOrder(orderId: string): Promise<void> {
    console.log('下载订单文件:', orderId);
    // 实现下载订单文件逻辑
}

/**
 * 处理分页点击
 */
async function handlePaginationClick(event: Event): Promise<void> {
    const target = event.target as HTMLElement;
    const button = target.closest('[data-page]') as HTMLElement;
    
    if (button && !button.hasAttribute('disabled')) {
        const page = parseInt(button.dataset.page!);
        await refreshOrdersList(page);
    }
}

/**
 * 获取当前筛选条件
 */
function getCurrentFilters(): OrderFilters {
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
    const typeFilter = document.getElementById('type-filter') as HTMLSelectElement;
    
    return {
        search: searchInput?.value || '',
        status: (statusFilter?.value as OrderFilters['status']) || 'all',
        type: (typeFilter?.value as OrderFilters['type']) || 'all'
    };
}

/**
 * 刷新订单列表
 */
async function refreshOrdersList(page: number = 1): Promise<void> {
    try {
        const tableContainer = document.getElementById('orders-table-container');
        
        // 显示加载状态
        if (tableContainer) {
            tableContainer.innerHTML = `
                <div class="flex items-center justify-center py-12">
                    <div class="text-gray-500">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <div>加载中...</div>
                    </div>
                </div>
            `;
        }
        
        const filters = getCurrentFilters();
        const { orders, pagination } = await getUserOrders(filters, page);
        
        const paginationContainer = document.getElementById('pagination-container');
        
        if (tableContainer) {
            if (orders.length > 0) {
                tableContainer.innerHTML = generateDesktopOrderTable(orders) + generateMobileOrderList(orders);
            } else {
                tableContainer.innerHTML = `
                    <div class="text-center py-12">
                        <div class="w-24 h-24 mx-auto mb-4 text-gray-300">
                            <i class="fas fa-search text-6xl"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">未找到订单</h3>
                        <p class="text-gray-500">请尝试调整筛选条件</p>
                    </div>
                `;
            }
        }
        
        if (paginationContainer && orders.length > 0) {
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
        } else if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
        
        // 重新设置事件监听器
        setupOrderActions();
        setupPagination();
        
        // 检查空状态
        checkEmptyState();
        
    } catch (error) {
        console.error('Error refreshing orders list:', error);
        
        const tableContainer = document.getElementById('orders-table-container');
        if (tableContainer) {
            tableContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-24 h-24 mx-auto mb-4 text-gray-300">
                        <i class="fas fa-exclamation-triangle text-6xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
                    <p class="text-gray-500 mb-4">请检查网络连接或稍后重试</p>
                    <button class="btn btn-primary" onclick="refreshOrdersList()">
                        <i class="fas fa-sync-alt mr-2"></i>
                        重新加载
                    </button>
                </div>
            `;
        }
        
        if ((window as any).notificationService) {
            (window as any).notificationService.error('加载订单列表失败');
        }
    }
}

/**
 * 检查并显示空状态
 */
function checkEmptyState(): void {
    const tableContainer = document.getElementById('orders-table-container');
    const emptyState = document.getElementById('empty-state');
    
    if (tableContainer && emptyState) {
        const hasOrders = tableContainer.querySelector('tbody tr, .mobile-table-row');
        
        if (!hasOrders) {
            tableContainer.style.display = 'none';
            emptyState.classList.remove('hidden');
        } else {
            tableContainer.style.display = 'block';
            emptyState.classList.add('hidden');
        }
    }
}
