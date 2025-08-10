from flask import Blueprint, request, jsonify
from flask_security import roles_required
from datetime import datetime, timedelta

from backend.app.models.service_obj.standard_form import StandardForm
from backend.app.services.admin_handler import (
    force_reset_password,
    get_all_users,
    create_role,
    assign_role_to_user,
    remove_role_from_user,
    toggle_user_active,
    get_all_roles,
    update_role,
    delete_role,
    get_manageable_roles_for_user,
    bulk_update_user_roles,
    get_role_hierarchy_tree
)
from backend.app.utils.permission_utils import require_permission, require_admin

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
            "status": item.status or 'pending',
            "created_gmt": item.created_gmt.isoformat() if item.created_gmt else None,
            "updated_gmt": item.updated_gmt.isoformat() if item.updated_gmt else None
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
        "status": form.status or 'pending',
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
@require_permission('admin')
def get_all_users_api():
    """获取所有用户列表"""
    try:
        # 获取查询参数
        email = request.args.get('email', '', type=str)
        name = request.args.get('name', '', type=str)
        phone = request.args.get('phone', '', type=str)
        wechat = request.args.get('wechat', '', type=str)
        
        # 调用服务函数
        users = get_all_users(
            email_query=email if email else None,
            name_query=name if name else None,
            phone_query=phone if phone else None,
            wechat_query=wechat if wechat else None
        )
        
        return jsonify({
            "success": True,
            "data": users
        }), 200
    except Exception as e:
        return jsonify({
            "success": False, 
            "message": str(e)
        }), 500


@admin_bp.route("/users/<user_id>/roles", methods=["POST", "DELETE"])
@require_permission('admin')
def manage_user_roles_api(user_id):
    """管理用户角色"""
    try:
        data = request.get_json()
        role_code = data.get("role_code")
        
        if request.method == "POST":
            result = assign_role_to_user(user_id, role_code)
        else:  # DELETE
            result = remove_role_from_user(user_id, role_code)
            
        return jsonify(result), 200 if result["success"] else 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/users/<user_id>/roles", methods=["PUT"])
@require_permission('admin')
def bulk_update_user_roles_api(user_id):
    """批量更新用户角色"""
    try:
        data = request.get_json()
        role_codes = data.get("role_codes", [])
        
        result = bulk_update_user_roles(user_id, role_codes)
        return jsonify(result), 200 if result["success"] else 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/create-role", methods=["POST"])
@require_admin()
def create_role_api():
    data = request.get_json()
    code = data.get("code")
    display_name = data.get("display_name")  # 前端发送displayName，httpClient转换为display_name
    description = data.get("description", "")
    parent_code = data.get("parent_code")    # 前端发送parentCode，httpClient转换为parent_code
    level = data.get("level")
    color = data.get("color", "blue")
    icon = data.get("icon", "fas fa-circle")

    if not code or not display_name:
        return jsonify({"success": False, "message": "缺少必要参数"}), 400

    result = create_role(code, display_name, description, parent_code, level, color, icon)
    return jsonify(result), 200 if result["success"] else 409


@admin_bp.route("/assign-role", methods=["POST"])
@require_permission('admin')
def assign_role_api():
    data = request.get_json()
    email = data.get("email")
    role = data.get("role")

    if not email or not role:
        return jsonify({"success": False, "message": "缺少参数"}), 400

    result = assign_role_to_user(email, role)
    return jsonify(result), 200 if result["success"] else 404


@admin_bp.route("/remove-role", methods=["POST"])
@require_permission('admin')
def remove_role_api():
    data = request.get_json()
    email = data.get("email")
    role = data.get("role")

    if not email or not role:
        return jsonify({"success": False, "message": "缺少参数"}), 400

    result = remove_role_from_user(email, role)
    return jsonify(result), 200 if result["success"] else 404


@admin_bp.route("/toggle-user", methods=["POST"])
@require_permission('admin')
def toggle_user_api():
    data = request.get_json()
    email = data.get("email")
    active = data.get("active")

    if not email or active is None:
        return jsonify({"success": False, "message": "缺少参数"}), 400

    result = toggle_user_active(email, active)
    return jsonify(result), 200 if result["success"] else 404





@admin_bp.route("/forms/<int:form_id>/status", methods=["PUT"])
@roles_required('admin')
def update_form_status(form_id):
    """更新表单状态"""
    data = request.get_json()
    status = data.get("status")
    
    if not status:
        return jsonify({"success": False, "message": "缺少状态参数"}), 400
    
    valid_statuses = ['pending', 'processing', 'completed', 'cancelled', 'rejected']
    if status not in valid_statuses:
        return jsonify({"success": False, "message": "无效的状态值"}), 400
    
    try:
        form = StandardForm.query.get_or_404(form_id)
        form.status = status
        form.updated_gmt = datetime.utcnow()
        
        from backend.app import db
        db.session.commit()
        
        return jsonify({"success": True, "message": "状态更新成功"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/forms/<int:form_id>/remark", methods=["PUT"])
@roles_required('admin')
def update_form_remark(form_id):
    """更新表单备注"""
    data = request.get_json()
    remark = data.get("remark", "")
    
    try:
        form = StandardForm.query.get_or_404(form_id)
        form.remark = remark
        form.updated_gmt = datetime.utcnow()
        
        from backend.app import db
        db.session.commit()
        
        return jsonify({"success": True, "message": "备注更新成功"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/dashboard/stats", methods=["GET"])
@roles_required('admin')
def get_dashboard_stats():
    """获取仪表盘统计数据"""
    try:
        from backend.app.services.admin_handler import get_all_users
        
        # 获取用户统计
        users_data = get_all_users()
        total_users = len(users_data)
        
        # 获取表单统计
        total_forms = StandardForm.query.count()
        pending_forms = StandardForm.query.filter_by(status='pending').count()
        
        # 获取今日新增
        from datetime import date
        today = date.today()
        today_new = StandardForm.query.filter(
            StandardForm.created_gmt >= today,
            StandardForm.created_gmt < today + timedelta(days=1)
        ).count()
        
        return jsonify({
            "success": True,
            "data": {
                "total_users": total_users,
                "total_forms": total_forms,
                "pending_forms": pending_forms,
                "today_new": today_new
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/roles", methods=["GET"])
@require_permission('admin')
def get_roles_list():
    """获取角色列表和层次结构"""
    try:
        result = get_all_roles()
        return jsonify(result), 200 if result["success"] else 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/roles/manageable", methods=["GET"])
@require_permission('admin')
def get_manageable_roles():
    """获取当前用户可以管理的角色列表"""
    try:
        result = get_manageable_roles_for_user()
        return jsonify(result), 200 if result["success"] else 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/roles/<role_code>", methods=["PUT"])
@require_permission('admin')
def update_role_api(role_code):
    """更新角色信息"""
    try:
        data = request.get_json()
        # 移除空值
        update_data = {k: v for k, v in data.items() if v is not None}
        
        result = update_role(role_code, **update_data)
        return jsonify(result), 200 if result["success"] else 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/roles/hierarchy", methods=["GET"])
@require_permission('admin')
def get_roles_hierarchy_api():
    """获取角色层次结构树"""
    try:
        result = get_role_hierarchy_tree()
        return jsonify(result), 200 if result["success"] else 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route("/roles/<role_code>", methods=["DELETE"])
@require_permission('admin')
def delete_role_api(role_code):
    """删除角色"""
    try:
        result = delete_role(role_code)
        return jsonify(result), 200 if result["success"] else 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500