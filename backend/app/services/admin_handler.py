from flask import current_app
from flask_security.utils import hash_password
from backend.app.models import db
from backend.app.models.auth_obj.user import User


def force_reset_password(email, new_password):
    user = current_app.user_datastore.find_user(email=email)
    if not user:
        return {"success": False, "message": "用户不存在"}
    user.password = hash_password(new_password)
    db.session.commit()
    return {"success": True, "message": "密码已重置"}


def get_all_users():
    users = User.query.order_by(User.id.asc()).all()
    result = []
    for user in users:
        roles = [r.name for r in user.roles]
        result.append({
            "email": user.email,
            "roles": roles,
            "active": user.active
        })
    return result


def create_role(name, description=''):
    if current_app.user_datastore.find_role(name=name):
        return {"success": False, "message": "角色已存在"}
    current_app.user_datastore.create_role(name=name, description=description)
    db.session.commit()
    return {"success": True, "message": f"角色 {name} 已创建"}


def assign_role_to_user(email, role_name):
    user = current_app.user_datastore.find_user(email=email)
    role = current_app.user_datastore.find_role(name=role_name)
    if not user:
        return {"success": False, "message": "用户不存在"}
    if not role:
        return {"success": False, "message": "角色不存在"}
    current_app.user_datastore.add_role_to_user(user, role)
    db.session.commit()
    return {"success": True, "message": f"角色 {role_name} 已分配给 {email}"}


def remove_role_from_user(email, role_name):
    user = current_app.user_datastore.find_user(email=email)
    role = current_app.user_datastore.find_role(name=role_name)
    if not user:
        return {"success": False, "message": "用户不存在"}
    if not role:
        return {"success": False, "message": "角色不存在"}
    current_app.user_datastore.remove_role_from_user(user, role)
    db.session.commit()
    return {"success": True, "message": f"角色 {role_name} 已移除"}


def toggle_user_active(email, active):
    user = current_app.user_datastore.find_user(email=email)
    if not user:
        return {"success": False, "message": "用户不存在"}
    user.active = bool(active)
    db.session.commit()
    return {"success": True, "message": f"用户 {email} 已设置为 {'启用' if active else '禁用'}"}
