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
@roles_required('admin')
def get_user_list():
    """
    获取用户列表，支持模糊查询
    查询参数:
    - email: 邮箱模糊查询
    - name: 姓名模糊查询  
    - phone: 电话模糊查询
    - wechat: 微信ID模糊查询
    """
    email_query = request.args.get("email", "").strip()
    name_query = request.args.get("name", "").strip()
    phone_query = request.args.get("phone", "").strip()
    wechat_query = request.args.get("wechat", "").strip()
    
    # 将空字符串转换为None
    email_query = email_query if email_query else None
    name_query = name_query if name_query else None
    phone_query = phone_query if phone_query else None
    wechat_query = wechat_query if wechat_query else None
    
    users_data = get_all_users(
        email_query=email_query,
        name_query=name_query, 
        phone_query=phone_query,
        wechat_query=wechat_query
    )
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