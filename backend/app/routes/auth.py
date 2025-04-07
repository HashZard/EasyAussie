# backend/routes/auth.py
from flask import Blueprint, request, jsonify

auth_bp = Blueprint('auth', __name__, url_prefix='/api')

# ✅ 简易版本：默认密码由管理员统一设置
DEFAULT_PASSWORD = "admin2025"

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "message": "请输入邮箱和密码"}), 400

    if password != DEFAULT_PASSWORD:
        return jsonify({"success": False, "message": "密码错误"}), 401

    # ✅ 登录成功，返回 success，前端设置 cookie 即可
    return jsonify({"success": True, "email": email})
