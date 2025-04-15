from flask import Blueprint, request, jsonify

from backend.app.models.standard_form import StandardForm

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

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