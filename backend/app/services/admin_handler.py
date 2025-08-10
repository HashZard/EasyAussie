from flask import current_app
from flask_security.utils import hash_password
from flask_security import current_user
from backend.app.models import db
from backend.app.models.auth_obj.user import User, Role
from backend.app.utils.permission_utils import can_manage_user, check_role_operation_permission


def force_reset_password(email, new_password):
    user = current_app.user_datastore.find_user(email=email)
    if not user:
        return {"success": False, "message": "用户不存在"}
    user.password = hash_password(new_password)
    db.session.commit()
    return {"success": True, "message": "密码已重置"}


def get_all_users(email_query=None, name_query=None, phone_query=None, wechat_query=None, page=None, per_page=None, search=None, role=None):
    """
    获取用户列表，支持模糊查询和分页
    """
    query = User.query
    
    # 添加模糊查询条件
    if email_query:
        query = query.filter(User.email.ilike(f"%{email_query}%"))
    if name_query:
        query = query.filter(User.name.ilike(f"%{name_query}%"))
    if phone_query:
        query = query.filter(User.phone.ilike(f"%{phone_query}%"))
    if wechat_query:
        query = query.filter(User.wechat_nickname.ilike(f"%{wechat_query}%"))
    
    # 支持通用搜索参数
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            User.email.ilike(search_pattern) |
            User.name.ilike(search_pattern) |
            User.phone.ilike(search_pattern) |
            User.wechat_nickname.ilike(search_pattern)
        )
    
    # 角色过滤
    if role:
        query = query.join(User.roles).filter(Role.code == role)
    
    users = query.order_by(User.id.asc()).all()
    result = []
    for user in users:
        user_dict = user.to_dict()
        result.append(user_dict)
    return result


def get_all_roles():
    """获取所有激活的角色"""
    try:
        roles = Role.query.filter_by(is_active=True).order_by(Role.level).all()
        return {
            "success": True,
            "data": {
                "roles": [role.to_dict() for role in roles],
                "hierarchy": Role.get_role_hierarchy()
            }
        }
    except Exception as e:
        return {"success": False, "message": f"获取角色列表失败: {str(e)}"}


def create_role(code, display_name, description='', parent_code=None, level=None, color='blue', icon='fas fa-circle'):
    """创建新角色"""
    try:
        # 权限检查
        operator = current_user
        if parent_code:
            can_operate, message = check_role_operation_permission(operator, parent_code, 'create')
            if not can_operate:
                return {"success": False, "message": message}
        
        # 检查角色代码是否已存在
        if Role.query.filter_by(code=code).first():
            return {"success": False, "message": "角色代码已存在"}
        
        # 查找父角色
        parent_role = None
        if parent_code:
            parent_role = Role.query.filter_by(code=parent_code).first()
            if not parent_role:
                return {"success": False, "message": "父角色不存在"}
        
        # 自动设置等级
        if level is None:
            if parent_role:
                level = parent_role.level + 1
            else:
                # 如果没有父角色，设置为当前最低等级+1
                max_level = db.session.query(db.func.max(Role.level)).scalar() or 0
                level = max_level + 1
        
        # 创建角色
        new_role = Role(
            code=code,
            display_name=display_name,
            description=description,
            parent_role_id=parent_role.id if parent_role else None,
            level=level,
            color=color,
            icon=icon
        )
        
        db.session.add(new_role)
        db.session.commit()
        
        return {
            "success": True,
            "message": f"角色 {display_name} 已创建",
            "data": new_role.to_dict()
        }
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"创建角色失败: {str(e)}"}


def update_role(role_code, **kwargs):
    """更新角色信息"""
    try:
        # 权限检查
        operator = current_user
        can_operate, message = check_role_operation_permission(operator, role_code, 'update')
        if not can_operate:
            return {"success": False, "message": message}
        
        role = Role.query.filter_by(code=role_code).first()
        if not role:
            return {"success": False, "message": "角色不存在"}
        
        # 更新字段
        for key, value in kwargs.items():
            if hasattr(role, key) and value is not None:
                setattr(role, key, value)
        
        db.session.commit()
        return {
            "success": True,
            "message": f"角色 {role.display_name} 已更新",
            "data": role.to_dict()
        }
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"更新角色失败: {str(e)}"}


def delete_role(role_code):
    """删除角色"""
    try:
        # 权限检查
        operator = current_user
        can_operate, message = check_role_operation_permission(operator, role_code, 'delete')
        if not can_operate:
            return {"success": False, "message": message}
        
        role = Role.query.filter_by(code=role_code).first()
        if not role:
            return {"success": False, "message": "角色不存在"}
        
        # 检查是否有用户使用该角色
        if role.users.count() > 0:
            return {"success": False, "message": f"角色 {role.display_name} 还有用户在使用，无法删除"}
        
        # 检查是否有子角色
        if role.children:
            return {"success": False, "message": f"角色 {role.display_name} 还有子角色，无法删除"}
        
        # 软删除：设置为不活跃
        role.is_active = False
        db.session.commit()
        
        return {"success": True, "message": f"角色 {role.display_name} 已删除"}
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"删除角色失败: {str(e)}"}


def assign_role_to_user(email, role_code):
    """给用户分配角色"""
    try:
        # 权限检查
        operator = current_user
        can_operate, message = check_role_operation_permission(operator, role_code, 'assign')
        if not can_operate:
            return {"success": False, "message": message}
        
        user = User.query.filter_by(email=email).first()
        role = Role.query.filter_by(code=role_code).first()
        
        if not user:
            return {"success": False, "message": "用户不存在"}
        if not role:
            return {"success": False, "message": "角色不存在"}
        
        # 检查是否可以管理该用户
        if not can_manage_user(operator, user):
            return {"success": False, "message": "权限不足：无法管理该用户"}
        
        if role in user.roles:
            return {"success": False, "message": "用户已拥有该角色"}
        
        user.roles.append(role)
        db.session.commit()
        return {
            "success": True,
            "message": f"已为用户 {email} 分配角色 {role.display_name}",
            "data": user.to_dict()
        }
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"分配角色失败: {str(e)}"}


def remove_role_from_user(email, role_code):
    """移除用户角色"""
    try:
        # 权限检查
        operator = current_user
        can_operate, message = check_role_operation_permission(operator, role_code, 'assign')
        if not can_operate:
            return {"success": False, "message": message}
        
        user = User.query.filter_by(email=email).first()
        role = Role.query.filter_by(code=role_code).first()
        
        if not user:
            return {"success": False, "message": "用户不存在"}
        if not role:
            return {"success": False, "message": "角色不存在"}
        
        # 检查是否可以管理该用户
        if not can_manage_user(operator, user):
            return {"success": False, "message": "权限不足：无法管理该用户"}
        
        if role not in user.roles:
            return {"success": False, "message": "用户没有该角色"}
        
        user.roles.remove(role)
        db.session.commit()
        return {
            "success": True,
            "message": f"已移除用户 {email} 的角色 {role.display_name}",
            "data": user.to_dict()
        }
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"移除角色失败: {str(e)}"}


def toggle_user_active(email, active):
    """切换用户激活状态"""
    try:
        operator = current_user
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return {"success": False, "message": "用户不存在"}
        
        # 检查是否可以管理该用户
        if not can_manage_user(operator, user):
            return {"success": False, "message": "权限不足：无法管理该用户"}
        
        user.active = bool(active)
        db.session.commit()
        return {"success": True, "message": f"用户 {email} 已设置为 {'启用' if active else '禁用'}"}
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"切换用户状态失败: {str(e)}"}


def bulk_update_user_roles(user_id, role_codes):
    """批量更新用户角色"""
    try:
        user = User.query.get(user_id)
        if not user:
            return {"success": False, "message": "用户不存在"}
        
        # 检查权限 - 确保当前用户可以管理目标用户
        if not can_manage_user(current_user, user):
            return {"success": False, "message": "没有权限管理此用户"}
        
        # 获取要分配的角色
        roles_to_assign = []
        for role_code in role_codes:
            role = Role.query.filter_by(code=role_code).first()
            if not role:
                return {"success": False, "message": f"角色 {role_code} 不存在"}
            
            # 检查权限 - 确保当前用户可以分配这个角色
            if not check_role_operation_permission(current_user, role, 'assign'):
                return {"success": False, "message": f"没有权限分配角色 {role.display_name}"}
            
            roles_to_assign.append(role)
        
        # 移除用户的所有角色
        user.roles.clear()
        
        # 分配新角色
        for role in roles_to_assign:
            user.roles.append(role)
        
        db.session.commit()
        
        # 构建用户角色信息
        user_roles = []
        for role in user.roles:
            user_roles.append({
                "code": role.code,
                "display_name": role.display_name,
                "description": role.description,
                "level": role.level,
                "parent_code": role.parent_role.code if role.parent_role else None
            })
        
        return {
            "success": True,
            "message": "用户角色更新成功",
            "user": {
                "id": user.id,
                "email": user.email,
                "roles": user_roles
            }
        }
        
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"更新用户角色失败: {str(e)}"}


def get_manageable_roles_for_user():
    """获取当前用户可以管理的角色列表"""
    try:
        user_level = current_user.get_highest_role_level()
        if user_level is None:
            return {"success": False, "message": "没有角色管理权限"}
        
        # 获取级别高于当前用户的角色（数值更大）
        manageable_roles = Role.query.filter(Role.level > user_level).order_by(Role.level).all()
        
        roles_data = []
        for role in manageable_roles:
            roles_data.append({
                "code": role.code,
                "display_name": role.display_name,
                "description": role.description,
                "level": role.level,
                "parent_code": role.parent_role.code if role.parent_role else None
            })
        
        return {
            "success": True,
            "roles": roles_data
        }
        
    except Exception as e:
        return {"success": False, "message": f"获取可管理角色失败: {str(e)}"}


def get_role_hierarchy_tree():
    """获取完整的角色层次结构树"""
    try:
        # 获取所有顶级角色（没有父角色的角色）
        root_roles = Role.query.filter_by(parent_role_id=None).order_by(Role.level).all()
        
        def build_role_tree(roles):
            tree = []
            for role in roles:
                role_data = {
                    "code": role.code,
                    "display_name": role.display_name,
                    "description": role.description,
                    "level": role.level,
                    "parent_code": role.parent_role.code if role.parent_role else None,
                    "children": build_role_tree(role.children.order_by(Role.level).all())
                }
                tree.append(role_data)
            return tree
        
        hierarchy_tree = build_role_tree(root_roles)
        
        return {
            "success": True,
            "hierarchy": hierarchy_tree
        }
        
    except Exception as e:
        return {"success": False, "message": f"获取角色层次结构失败: {str(e)}"}
