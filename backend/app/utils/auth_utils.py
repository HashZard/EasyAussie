from functools import wraps

from flask import request, jsonify, g, current_app
from itsdangerous import BadSignature

from backend.app import db
from backend.app.models.auth_obj.user import User


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid token"}), 401

        token = auth_header.split(" ")[1]

        try:
            fs_uniquifier = verify_token(token)
        except Exception as e:
            print("Token 解码失败:", e)
            return jsonify({"error": "Invalid token"}), 401

        if isinstance(fs_uniquifier, list):
            fs_uniquifier = fs_uniquifier[0]

        if not fs_uniquifier:
            return jsonify({"error": "Invalid token"}), 401

        user = db.session.query(User).filter_by(fs_uniquifier=fs_uniquifier).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        g.current_user = user
        return f(*args, **kwargs)

    return decorated


def optional_token(f):
    """
    可选的token验证装饰器
    如果有token且有效，则设置g.current_user
    如果没有token或token无效，则g.current_user为None，但不返回错误
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        g.current_user = None
        
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
            try:
                fs_uniquifier = verify_token(token)
                if fs_uniquifier:
                    if isinstance(fs_uniquifier, list):
                        fs_uniquifier = fs_uniquifier[0]
                    
                    user = db.session.query(User).filter_by(fs_uniquifier=fs_uniquifier).first()
                    if user:
                        g.current_user = user
            except Exception as e:
                # 静默处理token验证失败，不影响请求继续
                print("Optional token 验证失败:", e)
        
        return f(*args, **kwargs)

    return decorated


def verify_token(token):
    try:
        max_age = current_app.config.get("SECURITY_TOKEN_MAX_AGE", 3600)
        data = current_app.security.remember_token_serializer.loads(token, max_age=max_age)
        return data
    except BadSignature as e:
        print("Token 解码失败:", e)
        return None
