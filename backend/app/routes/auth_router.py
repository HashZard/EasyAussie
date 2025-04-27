# backend/routes/auth.py
import random

from captcha.image import ImageCaptcha
from flask import Blueprint, request, jsonify, session, send_file, make_response

from backend.app.models.auth_obj.permission import UserPagePermission
from backend.app.services.auth_handler import register_user, verify_user

auth_bp = Blueprint('auth', __name__, url_prefix='/api')

# ✅ 简易版本：默认密码由管理员统一设置
DEFAULT_PASSWORD = "admin2025"


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    code = data.get("code")

    if not email or not password or not code:
        return jsonify({"success": False, "message": "信息不完整"}), 400

    if code != session.get("captcha_code"):
        return jsonify({"success": False, "message": "验证码错误"}), 403
    session.pop("captcha_code", None)

    result = verify_user(email, password)
    if result["success"]:
        user = result["user"]
        response = make_response(jsonify({"success": True}))
        response.set_cookie("user_email", user.email, httponly=False, samesite="Lax")
        response.set_cookie("user_role", user.role.value, httponly=False, samesite="Lax")
        return response
    else:
        return jsonify(result), 401


# 验证码生成接口
@auth_bp.route("/captcha", methods=["GET"])
def get_captcha():
    image = ImageCaptcha()
    code = str(random.randint(1000, 9999))
    session["captcha_code"] = code

    image_data = image.generate(code)
    return send_file(image_data, mimetype="image/png")


# 注册接口
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    code = data.get("code")

    if not email or not password or not code:
        return jsonify({"success": False, "message": "信息不完整"}), 400

    if code != session.get("captcha_code"):
        return jsonify({"success": False, "message": "验证码错误"}), 403
    session.pop("captcha_code", None)

    result = register_user(email, password)

    return jsonify(result), 200 if result["success"] else 409

# 查询某个用户已有的页面权限
@auth_bp.route("/permissions", methods=["GET"])
def get_user_permissions():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "缺少用户邮箱参数"}), 400

    permissions = UserPagePermission.query.filter_by(user_email=email, is_active=True).all()
    allowed_pages = [p.page_path for p in permissions]

    return jsonify({"allowed_pages": allowed_pages})