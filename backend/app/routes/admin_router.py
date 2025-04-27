from flask import Blueprint, request, jsonify, session

from backend.app.models.auth_obj.user import User
from backend.app.models.service_obj.standard_form import StandardForm
from backend.app.services.auth_handler import force_reset_password, edit_page_permission

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')


@admin_bp.before_request
def check_admin_permission():
    role = session.get("user_role")
    if role != "admin":
        return jsonify({"success": False, "message": "权限不足"}), 403

@admin_bp.route("/forms", methods=["GET"])
def get_standard_forms():
    email = request.args.get("email", "").strip()
    form_type = request.args.get("form_type", "").strip()

    query = StandardForm.query

    if email:
        query = query.filter(StandardForm.email.ilike(f"%{email}%"))
    if form_type:
        query = query.filter_by(form_type=form_type)

    query = query.order_by(StandardForm.created_gmt.desc())
    results = query.all()

    data = [
        {
            "id": item.id,
            "email": item.email,
            "form_type": item.form_type,
            "created_gmt": item.created_gmt.isoformat() if item.created_gmt else None
        }
        for item in results
    ]

    return jsonify({"results": data})


@admin_bp.route("/forms/<int:id>", methods=["GET"])
def get_form_detail(id):
    form = StandardForm.query.get_or_404(id)

    return jsonify({
        "id": form.id,
        "email": form.email,
        "form_type": form.form_type,
        "form_data": form.form_data,
        "files": form.files,
        "remark": form.remark,
        "created_gmt": form.created_gmt.isoformat() if form.created_gmt else None,
        "updated_gmt": form.updated_gmt.isoformat() if form.updated_gmt else None
    })

@admin_bp.route("/reset-password", methods=["POST"])
def admin_reset_password():
    data = request.json

    result = force_reset_password(data["email"], data["new_password"])
    return jsonify(result)

@admin_bp.route("/users", methods=["GET"])
def get_user_list():
    users = User.query.order_by(User.id.asc()).all()
    data = [
        {
            "email": user.email,
            "role": user.role.value if hasattr(user.role, "value") else user.role
        }
        for user in users
    ]
    return jsonify({"users": data})

# 给某个用户授予页面访问权限
@admin_bp.route("/permissions", methods=["POST"])
def edit_permission_route():
    data = request.get_json()
    email = data.get("email")
    page_path = data.get("page_path")
    action = data.get("action")  # "grant" or "revoke"
    grant_by = data.get("grant_by")  # 授权人，可选

    if not email or not page_path or not action:
        return jsonify({"success": False, "message": "缺少必要参数"}), 400

    result = edit_page_permission(email, page_path, action, grant_by)
    return jsonify(result)
