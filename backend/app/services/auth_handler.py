from backend.app.models import db
from backend.app.models.auth_obj.permission import PagePermission
from backend.app.models.auth_obj.user import User, UserType
import bcrypt


def register_user(email: str, password: str, role: UserType = UserType.USER) -> dict:
    if User.query.filter_by(email=email).first():
        return {"success": False, "message": "邮箱已注册"}

    hashed_pw = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    new_user = User(email=email, password=hashed_pw, role=role)
    db.session.add(new_user)
    db.session.commit()
    return {"success": True, "message": "注册成功"}


def verify_user(email: str, password: str) -> dict:
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.checkpw(password.encode(), user.password.encode()):
        return {"success": True, "user": user}
    return {"success": False, "message": "账号或密码错误"}


def force_reset_password(email: str, new_password: str) -> dict:
    user = User.query.filter_by(email=email).first()
    if not user:
        return {"success": False, "message": "用户不存在"}

    hashed_pw = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    user.password = hashed_pw
    db.session.commit()

    return {"success": True, "message": "密码已更新"}


def edit_page_permission(email: str, page_path: str, action: str) -> dict:
    """根据 action（grant/revoke）处理页面权限"""
    existing = PagePermission.query.filter_by(email=email, page_path=page_path).first()

    if action == "grant":
        if existing:
            if not existing.is_active:
                existing.is_active = True
                db.session.commit()
                return {"success": True, "message": "权限已恢复"}
            return {"success": True, "message": "权限已存在，无需变更"}

        # 新建权限
        new_permission = PagePermission(
            email=email,
            page_path=page_path,
        )
        db.session.add(new_permission)
        db.session.commit()
        return {"success": True, "message": "权限授予成功"}

    elif action == "revoke":
        if existing and existing.is_active:
            existing.is_active = False
            db.session.commit()
            return {"success": True, "message": "权限已撤销"}
        return {"success": False, "message": "权限不存在或已撤销"}

    else:
        return {"success": False, "message": "非法操作"}