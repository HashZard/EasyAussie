/**
 * 前后端统一的表单和订单类型定义
 * 与后端 FormType 枚举保持一致
 */

// 表单类型 - 与后端 FormType 枚举完全一致
export type FormType = 'inspection' | 'coverletter' | 'rentalApplication' | 'airportPickup' | 'test';

// 表单状态 - 与后端 FormStatus 枚举完全一致  
export type FormStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'rejected';

// 订单类型就是表单类型（统一后不再需要映射）
export type OrderType = FormType;

// 订单状态
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

/**
 * 表单类型显示名称映射
 */
export const FORM_TYPE_LABELS: Record<FormType, string> = {
    'inspection': '房屋检查',
    'airportPickup': '机场接送',
    'rentalApplication': '租房申请',
    'coverletter': '求职信',
    'test': '测试服务'
};

/**
 * 表单状态显示名称和样式映射
 */
export const FORM_STATUS_LABELS: Record<FormStatus, { label: string; className: string }> = {
    'pending': { label: '待处理', className: 'status-badge status-warning' },
    'processing': { label: '处理中', className: 'status-badge status-info' },
    'completed': { label: '已完成', className: 'status-badge status-success' },
    'cancelled': { label: '已取消', className: 'status-badge status-error' },
    'rejected': { label: '已拒绝', className: 'status-badge status-error' }
};

/**
 * 订单状态显示名称和样式映射
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; className: string }> = {
    'pending': { label: '待处理', className: 'status-badge status-warning' },
    'processing': { label: '处理中', className: 'status-badge status-info' },
    'completed': { label: '已完成', className: 'status-badge status-success' },
    'cancelled': { label: '已取消', className: 'status-badge status-error' }
};

/**
 * 校验表单类型是否有效
 */
export function isValidFormType(type: string): type is FormType {
    return ['inspection', 'coverletter', 'rentalApplication', 'airportPickup', 'test'].includes(type);
}

/**
 * 校验表单状态是否有效
 */
export function isValidFormStatus(status: string): status is FormStatus {
    return ['pending', 'processing', 'completed', 'cancelled', 'rejected'].includes(status);
}

/**
 * 校验订单状态是否有效
 */
export function isValidOrderStatus(status: string): status is OrderStatus {
    return ['pending', 'processing', 'completed', 'cancelled'].includes(status);
}
