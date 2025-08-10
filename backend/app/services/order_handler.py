import json
import logging
from typing import Dict, List, Optional, Any
from sqlalchemy import and_, or_, func

from backend.app.models import db
from backend.app.models.service_obj.standard_form import StandardForm, FormType

app_logger = logging.getLogger('app_logger')


def form_to_order(standard_form: StandardForm) -> Dict[str, Any]:
    """将StandardForm转换为返回格式，只返回StandardForm实际拥有的字段"""
    return {
        # StandardForm的所有字段
        'id': str(standard_form.id),
        'email': standard_form.email,
        'formType': standard_form.form_type,
        'formData': standard_form.form_data,  # 原始JSON字符串，由前端解析
        'files': standard_form.files,
        'remark': standard_form.remark,
        'status': standard_form.status or 'pending',
        'createdAt': standard_form.created_gmt.isoformat(),
        'updatedAt': standard_form.updated_gmt.isoformat() if standard_form.updated_gmt else None
    }


def get_user_orders(email: str, page: int = 1, per_page: int = 10, 
                   status_filter: str = None, type_filter: str = None, 
                   search: str = None) -> Dict[str, Any]:
    """获取用户订单列表"""
    
    # 构建基础查询
    query = StandardForm.query.filter_by(email=email)
    
    # 状态筛选
    if status_filter and status_filter != 'all':
        query = query.filter(StandardForm.status == status_filter)
    
    # 类型筛选
    if type_filter and type_filter != 'all':
        if FormType.is_valid(type_filter):
            query = query.filter(StandardForm.form_type == type_filter)
    
    # 搜索筛选
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                StandardForm.form_data.like(search_pattern),
                StandardForm.remark.like(search_pattern)
            )
        )
    
    # 排序：最新的在前
    query = query.order_by(StandardForm.created_gmt.desc())
    
    # 分页
    paginated = query.paginate(
        page=page, 
        per_page=per_page, 
        error_out=False
    )
    
    # 转换为订单格式
    orders = [form_to_order(form) for form in paginated.items]
    
    return {
        'orders': orders,
        'pagination': {
            'currentPage': page,
            'totalPages': paginated.pages,
            'totalItems': paginated.total,
            'itemsPerPage': per_page,
            'hasNext': paginated.has_next,
            'hasPrev': paginated.has_prev
        }
    }


def get_order_by_id(order_id: int, email: str) -> Optional[Dict[str, Any]]:
    """根据ID获取订单详情"""
    form = StandardForm.query.filter_by(id=order_id, email=email).first()
    
    if not form:
        return None
    
    return form_to_order(form)


def cancel_order(order_id: int, email: str) -> bool:
    """取消订单"""
    form = StandardForm.query.filter_by(id=order_id, email=email).first()
    
    if not form:
        return False
    
    # 检查是否可以取消（只有pending和processing状态可以取消）
    if form.status in ['completed', 'cancelled']:
        return False
    
    # 更新状态为cancelled
    form.status = 'cancelled'
    db.session.commit()
    
    app_logger.info(f"[CANCEL_ORDER] 订单已取消 | 订单ID: {order_id} | 用户: {email}")
    
    return True


def get_order_stats(email: str) -> Dict[str, Any]:
    """获取用户订单统计数据"""
    
    # 基础统计查询
    base_query = StandardForm.query.filter_by(email=email)
    
    # 总订单数
    total_orders = base_query.count()
    
    # 各状态订单数
    completed_orders = base_query.filter(StandardForm.status == 'completed').count()
    pending_orders = base_query.filter(StandardForm.status == 'pending').count()
    processing_orders = base_query.filter(StandardForm.status == 'processing').count()
    cancelled_orders = base_query.filter(StandardForm.status == 'cancelled').count()
    
    # 按类型统计
    type_stats = {}
    # 使用枚举获取所有有效的表单类型
    for form_type_enum in FormType:
        form_type = form_type_enum.value
        count = base_query.filter(StandardForm.form_type == form_type).count()
        if count > 0:
            type_stats[form_type] = count
    
    return {
        'totalOrders': total_orders,
        'completedOrders': completed_orders,
        'pendingOrders': pending_orders,
        'processingOrders': processing_orders,
        'cancelledOrders': cancelled_orders,
        'totalSpent': 0,  # 目前不涉及金额
        'typeStats': type_stats
    }


def update_order_status(order_id: int, status: str, email: str = None) -> bool:
    """更新订单状态（主要供管理员使用）"""
    query = StandardForm.query.filter_by(id=order_id)
    
    # 如果指定了email，则只能更新该用户的订单
    if email:
        query = query.filter_by(email=email)
    
    form = query.first()
    
    if not form:
        return False
    
    # 验证状态值
    valid_statuses = ['pending', 'processing', 'completed', 'cancelled']
    if status not in valid_statuses:
        return False
    
    form.status = status
    db.session.commit()
    
    app_logger.info(f"[UPDATE_ORDER_STATUS] 订单状态已更新 | 订单ID: {order_id} | 新状态: {status}")
    
    return True
