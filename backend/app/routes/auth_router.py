# backend/routes/auth.py
import random

from captcha.image import ImageCaptcha
from flask import Blueprint, request, jsonify, session, send_file
from flask_security import logout_user, auth_required

from backend.app.services.auth_handler import handle_login, handle_register

auth_bp = Blueprint('auth', __name__, url_prefix='/api')

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    code = data.get("code")

    result = handle_login(email, password, code)
    status = 200 if result["success"] else result.get("status", 400)
    return jsonify(result), status


@auth_bp.route("/logout", methods=["POST"])
@auth_required('token')
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
