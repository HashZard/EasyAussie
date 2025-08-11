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
    roles = [role.code for role in user.roles]  # 使用 code 而不是 name

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

    try:
        user = current_app.user_datastore.create_user(
            email=email,
            password=hash_password(password),
            active=True
        )
        db.session.flush()  # 确保用户ID被生成

        # 分配默认角色 - 直接查询 Role 表
        from backend.app.models.auth_obj.user import Role
        default_role = Role.query.filter_by(code='user', is_active=True).first()
        
        if default_role:
            user.roles.append(default_role)
            db.session.commit()
            current_app.logger.info(f"成功为用户 {email} 分配默认角色 'user'")
        else:
            # 如果没有找到默认角色，抛出异常
            raise ValueError("默认角色 'user' 不存在")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"用户注册失败: {str(e)}")
        return {"success": False, "message": "注册失败，请重试", "status": 500}

    return {"success": True, "message": "注册成功"}

def handle_update_profile(user, data):
    """处理个人信息更新"""
    try:
        # 更新用户信息
        if 'name' in data:
            user.name = data['name']
        if 'wechat_nickname' in data:
            user.wechat_nickname = data['wechat_nickname']
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
