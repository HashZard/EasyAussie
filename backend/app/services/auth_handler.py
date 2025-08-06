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
    
    # 更新最后登录时间
    user.update_last_login()
    db.session.commit()
    
    token = user.get_auth_token()
    roles = [role.name for role in user.roles]

    return {
        "success": True,
        "message": "登录成功",
        "data": {
            "token": token,
            "user": {
                "email": user.email,
                "roles": roles
            }
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

def handle_update_profile(user, data):
    """处理个人信息更新"""
    try:
        # 更新用户信息
        if 'name' in data:
            user.name = data['name']
        if 'wechatNickname' in data:
            user.wechat_nickname = data['wechatNickname']
        if 'phone' in data:
            user.phone = data['phone']
        
        # 保存到数据库
        db.session.commit()
        
        return {
            "success": True,
            "message": "个人信息更新成功",
            "data": user.to_dict()
        }
    except Exception as e:
        db.session.rollback()
        return {
            "success": False,
            "message": "更新失败，请重试",
            "status": 400
        }

def handle_change_password(user, current_password, new_password):
    """处理密码修改"""
    if not current_password or not new_password:
        return {
            "success": False,
            "message": "请提供当前密码和新密码",
            "status": 400
        }
    
    try:
        # 验证当前密码
        if not verify_password(current_password, user.password):
            return {
                "success": False,
                "message": "当前密码不正确",
                "status": 400
            }
        
        # 更新密码
        user.password = hash_password(new_password)
        
        # 保存到数据库
        db.session.commit()
        
        return {
            "success": True,
            "message": "密码修改成功"
        }
    except Exception as e:
        db.session.rollback()
        return {
            "success": False,
            "message": "密码修改失败，请重试",
            "status": 400
        }
