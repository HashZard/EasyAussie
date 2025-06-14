from flask import Blueprint, request, jsonify
from flask_security import roles_required

from backend.app.models.service_obj.standard_form import StandardForm
from backend.app.services.admin_handler import (
    force_reset_password,
    get_all_users,
    create_role,
    assign_role_to_user,
    remove_role_from_user,
    toggle_user_active
)

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route("/forms", methods=["GET"])
@roles_required('admin')
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
@roles_required('admin')
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
@roles_required('admin')
def admin_reset_password():
    data = request.get_json()
    email = data.get("email")
    new_password = data.get("new_password")

    if not email or not new_password:
        return jsonify({"success": False, "message": "缺少参数"}), 400

    result = force_reset_password(email, new_password)
    return jsonify(result), 200 if result["success"] else 404


@admin_bp.route("/users", methods=["GET"])
@roles_required('admin')
def get_user_list():
    users_data = get_all_users()
    return jsonify({"users": users_data})


@admin_bp.route("/create-role", methods=["POST"])
@roles_required('admin')
def create_role_api():
    data = request.get_json()
    name = data.get("name")
    description = data.get("description", "")

    if not name:
        return jsonify({"success": False, "message": "缺少角色名称"}), 400

    result = create_role(name, description)
    return jsonify(result), 200 if result["success"] else 409


@admin_bp.route("/assign-role", methods=["POST"])
@roles_required('admin')
def assign_role():
    data = request.get_json()
    email = data.get("email")
    role = data.get("role")

    if not email or not role:
        return jsonify({"success": False, "message": "缺少参数"}), 400

    result = assign_role_to_user(email, role)
    return jsonify(result), 200 if result["success"] else 404


@admin_bp.route("/remove-role", methods=["POST"])
@roles_required('admin')
def remove_role():
    data = request.get_json()
    email = data.get("email")
    role = data.get("role")

    if not email or not role:
        return jsonify({"success": False, "message": "缺少参数"}), 400

    result = remove_role_from_user(email, role)
    return jsonify(result), 200 if result["success"] else 404


@admin_bp.route("/toggle-user", methods=["POST"])
@roles_required('admin')
def toggle_user():
    data = request.get_json()
    email = data.get("email")
    active = data.get("active")

    if not email or active is None:
        return jsonify({"success": False, "message": "缺少参数"}), 400

    result = toggle_user_active(email, active)
    return jsonify(result), 200 if result["success"] else 404