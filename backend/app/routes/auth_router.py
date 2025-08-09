# backend/routes/auth.py
import random

from captcha.image import ImageCaptcha
from flask import Blueprint, request, jsonify, session, send_file, g
from flask_security import logout_user

from backend.app.services.auth_handler import handle_login, handle_register, handle_update_profile, handle_change_password
from backend.app.utils.auth_utils import token_required, optional_token

auth_bp = Blueprint('auth', __name__, url_prefix='/api')


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    captcha = data.get("captcha")

    result = handle_login(email, password, captcha)
    status = 200 if result["success"] else result.get("status", 400)
    return jsonify(result), status


@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    logout_user()
    return jsonify({"success": True})


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
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    code = data.get("code")

    result = handle_register(email, password, code)
    status = 200 if result["success"] else result.get("status", 400)
    return jsonify(result), status


@auth_bp.route("/profile", methods=["GET"])
@optional_token
def profile():
    user = g.current_user
    if user:
        return jsonify({
            "success": True,
            "data": user.to_dict()
        })
    else:
        return jsonify({
            "success": True,
            "data": None,
            "message": "用户未登录"
        })


@auth_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile():
    user = g.current_user
    data = request.get_json()
    
    result = handle_update_profile(user, data)
    status = 200 if result["success"] else result.get("status", 400)
    return jsonify(result), status


@auth_bp.route("/change-password", methods=["POST"])
@token_required
def change_password():
    user = g.current_user
    data = request.get_json()
    
    current_password = data.get("currentPassword")
    new_password = data.get("newPassword")
    
    result = handle_change_password(user, current_password, new_password)
    status = 200 if result["success"] else result.get("status", 400)
    return jsonify(result), status
