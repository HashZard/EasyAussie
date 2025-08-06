import json
import logging
from typing import Dict, List, Optional, Any
from sqlalchemy import and_, or_, func

from backend.app.models import db
from backend.app.models.service_obj.standard_form import StandardForm, FormType

app_logger = logging.getLogger('app_logger')


def form_to_order(standard_form: StandardForm) -> Dict[str, Any]:
    """将StandardForm转换为Order格式"""
    return {
        'id': str(standard_form.id),
        'title': get_order_title_by_type(standard_form.form_type, standard_form.form_data),
        'type': map_form_type_to_order_type(standard_form.form_type),
        'status': standard_form.status or 'pending',
        'amount': 0,  # 目前不涉及金额
        'currency': 'AUD',
        'createdAt': standard_form.created_gmt.isoformat(),
        'updatedAt': standard_form.updated_gmt.isoformat() if standard_form.updated_gmt else None,
        'description': extract_description_from_form_data(standard_form.form_data, standard_form.form_type),
        'notes': standard_form.remark
    }


def get_order_title_by_type(form_type: str, form_data: str = None) -> str:
    """根据表单类型生成订单标题"""
    type_titles = {
        'inspection': '房屋检查服务',
        'airportPickup': '机场接送服务',
        'rentalApplication': '租房申请服务',
        'coverletter': '求职信服务',
        'test': '测试服务',
        'other': '其他服务'
    }
    
    base_title = type_titles.get(form_type, '服务订单')
    
    # 尝试从表单数据中提取更具体的信息
    if form_data:
        try:
            data = json.loads(form_data) if isinstance(form_data, str) else form_data
            
            # 房屋检查：提取地址信息
            if form_type == 'inspection' and 'property_add' in data:
                return f"房屋检查 - {data['property_add']}"
            
            # 机场接送：提取接送信息
            elif form_type == 'airportPickup':
                if 'pickupLocation' in data or 'dropoffLocation' in data:
                    pickup = data.get('pickupLocation', '未知地点')
                    dropoff = data.get('dropoffLocation', '未知地点')
                    return f"机场接送 - {pickup} → {dropoff}"
            
            # 租房申请：提取申请信息
            elif form_type == 'rentalApplication' and 'propertyAddress' in data:
                return f"租房申请 - {data['propertyAddress']}"
                
            # 求职信：提取职位信息
            elif form_type == 'coverletter' and 'position' in data:
                return f"求职信 - {data['position']}"
                
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    
    return base_title


def map_form_type_to_order_type(form_type: str) -> str:
    """将表单类型映射为订单类型"""
    type_mapping = {
        'inspection': 'inspection',
        'airportPickup': 'transfer',
        'rentalApplication': 'application',
        'coverletter': 'application',
        'test': 'other',
        'other': 'other'
    }
    return type_mapping.get(form_type, 'other')


def extract_description_from_form_data(form_data: str, form_type: str) -> str:
    """从表单数据中提取描述信息"""
    if not form_data:
        return ''
    
    try:
        data = json.loads(form_data) if isinstance(form_data, str) else form_data
        
        # 根据不同表单类型提取关键信息
        if form_type == 'inspection':
            parts = []
            if 'property_add' in data:
                parts.append(f"地址: {data['property_add']}")
            if 'appointment_date' in data:
                parts.append(f"预约时间: {data['appointment_date']}")
            return ' | '.join(parts)
            
        elif form_type == 'airportPickup':
            parts = []
            if 'pickupLocation' in data:
                parts.append(f"接: {data['pickupLocation']}")
            if 'dropoffLocation' in data:
                parts.append(f"送: {data['dropoffLocation']}")
            if 'pickupTime' in data:
                parts.append(f"时间: {data['pickupTime']}")
            return ' | '.join(parts)
            
        elif form_type == 'rentalApplication':
            parts = []
            if 'propertyAddress' in data:
                parts.append(f"地址: {data['propertyAddress']}")
            if 'rentAmount' in data:
                parts.append(f"租金: {data['rentAmount']}")
            return ' | '.join(parts)
            
        elif form_type == 'coverletter':
            parts = []
            if 'position' in data:
                parts.append(f"职位: {data['position']}")
            if 'company' in data:
                parts.append(f"公司: {data['company']}")
            return ' | '.join(parts)
        
        # 默认返回前几个字段的组合
        key_fields = ['name', 'title', 'type', 'subject']
        parts = []
        for field in key_fields:
            if field in data and data[field]:
                parts.append(f"{data[field]}")
                if len(parts) >= 2:  # 最多显示2个字段
                    break
        
        return ' | '.join(parts) if parts else '详情请查看订单详情'
        
    except (json.JSONDecodeError, TypeError):
        return '详情请查看订单详情'


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
        # 需要将订单类型映射回表单类型
        form_types = []
        if type_filter == 'inspection':
            form_types = ['inspection']
        elif type_filter == 'transfer':
            form_types = ['airportPickup']
        elif type_filter == 'application':
            form_types = ['rentalApplication', 'coverletter']
        elif type_filter == 'other':
            form_types = ['test', 'other']
        
        if form_types:
            query = query.filter(StandardForm.form_type.in_(form_types))
    
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
    for form_type in ['inspection', 'airportPickup', 'rentalApplication', 'coverletter', 'test']:
        count = base_query.filter(StandardForm.form_type == form_type).count()
        if count > 0:
            order_type = map_form_type_to_order_type(form_type)
            if order_type in type_stats:
                type_stats[order_type] += count
            else:
                type_stats[order_type] = count
    
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
