from backend.app.models import db
from backend.app.models.user import User
import bcrypt


def register_user(email: str, password: str, role: str = "user") -> dict:
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
