"""
权限管理工具类
支持角色继承的权限检查
"""

from functools import wraps
from flask import g, jsonify, current_app
from flask_security import auth_required, current_user
from backend.app.models.auth_obj.user import User, Role


def require_permission(required_role_code):
    """
    权限检查装饰器（支持角色继承）
    """
    def decorator(f):
        @wraps(f)
        @auth_required()
        def decorated_function(*args, **kwargs):
            user = current_user
            if not user or not user.has_role(required_role_code):
                return jsonify({
                    'success': False,
                    'message': f'需要 {required_role_code} 权限',
                    'code': 'INSUFFICIENT_PERMISSIONS'
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_role_level(max_level):
    """
    角色等级检查装饰器
    max_level: 允许的最大等级（数字越小等级越高）
    """
    def decorator(f):
        @wraps(f)
        @auth_required()
        def decorated_function(*args, **kwargs):
            user = current_user
            highest_role = user.get_highest_role()
            if not highest_role or highest_role.level > max_level:
                return jsonify({
                    'success': False,
                    'message': f'需要等级 {max_level} 或更高权限',
                    'code': 'INSUFFICIENT_ROLE_LEVEL'
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_admin():
    """
    管理员权限装饰器
    """
    return require_permission('admin')


def require_manager():
    """
    管理者权限装饰器（包括admin和manager）
    """
    return require_role_level(1)  # 等级1及以上


def can_manage_user(operator_user, target_user):
    """
    检查操作用户是否可以管理目标用户
    """
    if not operator_user:
        return False
    
    operator_highest = operator_user.get_highest_role()
    target_highest = target_user.get_highest_role()
    
    # 操作用户没有角色，无法管理任何人
    if not operator_highest:
        return False
    
    # 目标用户没有角色，可以被管理
    if not target_highest:
        return True
    
    # 比较角色等级
    return operator_highest.level < target_highest.level


def get_manageable_roles(user):
    """
    获取用户可以管理的角色列表
    """
    if not user:
        return []
    
    highest_role = user.get_highest_role()
    if not highest_role:
        return []
    
    # 只能管理等级更低的角色
    manageable_roles = Role.query.filter(
        Role.level > highest_role.level,
        Role.is_active == True
    ).order_by(Role.level).all()
    
    return manageable_roles


def check_role_operation_permission(operator_user, target_role_code, operation='view'):
    """
    检查角色操作权限
    operation: 'view', 'create', 'update', 'delete', 'assign'
    """
    if not operator_user:
        return False, "用户未登录"
    
    operator_highest = operator_user.get_highest_role()
    if not operator_highest:
        return False, "用户没有任何角色权限"
    
    target_role = Role.query.filter_by(code=target_role_code).first()
    if not target_role:
        return False, "目标角色不存在"
    
    # 管理员可以执行所有操作
    if operator_highest.code == 'admin':
        return True, "管理员权限"
    
    # 检查等级权限
    if operation in ['create', 'update', 'delete']:
        # 创建、更新、删除：只能操作等级更低的角色
        if operator_highest.level >= target_role.level:
            return False, f"权限不足：无法操作等级 {target_role.level} 的角色"
    
    elif operation == 'assign':
        # 分配角色：只能分配等级更低的角色
        if operator_highest.level >= target_role.level:
            return False, f"权限不足：无法分配等级 {target_role.level} 的角色"
    
    return True, "权限检查通过"
