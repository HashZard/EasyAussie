from flask import session, current_app
from flask_security import verify_password, hash_password, login_user
from backend.app.models import db

def handle_login(email, password, code):
    if not email or not password or not code:
        return {"success": False, "message": "请填写邮箱、密码和验证码", "status": 400}

    if code != session.get("captcha_code"):
        return {"success": False, "message": "验证码错误", "status": 403}
    session.pop("captcha_code", None)

    user = current_app.user_datastore.find_user(email=email)
    if not user or not verify_password(password, user.password):
        return {"success": False, "message": "账号或密码错误", "status": 401}

    if not user.active:
        return {"success": False, "message": "账号未激活", "status": 403}

    # 生成 token
    login_user(user)
    token = user.get_auth_token()
    roles = [role.name for role in user.roles]

    return {
        "success": True,
        "message": "登录成功",
        "token": token,
        "user": {
            "email": user.email,
            "roles": roles
        }
    }

def handle_register(email, password, code):
    if not email or not password or not code:
        return {"success": False, "message": "信息不完整", "status": 400}

    if code != session.get("captcha_code"):
        return {"success": False, "message": "验证码错误", "status": 403}
    session.pop("captcha_code", None)

    if current_app.user_datastore.find_user(email=email):
        return {"success": False, "message": "用户已存在", "status": 409}

    user = current_app.user_datastore.create_user(
        email=email,
        password=hash_password(password),
        active=True
    )
    db.session.commit()

    return {"success": True, "message": "注册成功"}
