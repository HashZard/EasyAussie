import hashlib
import json
import os

from flask import g
from werkzeug.utils import secure_filename

from backend.app.models import db
from backend.app.models.service_obj.standard_form import StandardForm, FormType
from backend.config.config import UploadConfig


def email_to_folder(email: str) -> str:
    """将 email 转为哈希值目录"""
    email = email.strip().lower()
    hash_value = hashlib.sha256(email.encode('utf-8')).hexdigest()
    return hash_value[:16]  # 取前16位作为目录名


def handle_file_uploads(file_dict: dict, folder: str) -> dict:
    """保存上传文件，返回字段 -> 路径映射"""
    os.makedirs(folder, exist_ok=True)
    saved = {}

    for field, file in file_dict.items():
        if file and file.filename:
            filename = secure_filename(file.filename)
            path = os.path.join(folder, filename)
            file.save(path)
            saved[field] = path

    return saved


def save_form(request) -> str:
    """保存表单数据（每次都创建新记录）"""
    email = g.current_user.email
    form_type = request.form.get('formType')
    remark = request.form.get('remark')

    if not email or not form_type:
        raise ValueError("Missing email or formType")

    # 校验表单类型
    if FormType.is_valid(form_type) is False:
        raise ValueError("Invalid form type: {}".format(form_type))

    # 处理字段
    form_data = request.form.to_dict(flat=False)
    for key, value in form_data.items():
        if not key.endswith("[]") and isinstance(value, list) and len(value) == 1:
            form_data[key] = value[0]
    form_data.pop('formType', None)
    form_data.pop('remark', None)

    # 处理文件上传
    folder = os.path.join(UploadConfig.UPLOAD_FOLDER, email_to_folder(email))
    new_files = handle_file_uploads(request.files, folder)

    # 处理空字段: 移除不保存
    for key in list(form_data.keys()):
        value = form_data[key]
        if value is None or (isinstance(value, str) and value.strip() == ""):
            form_data.pop(key)

    # 直接创建新记录
    form = StandardForm(
        email=email,
        form_type=form_type,
        form_data=json.dumps(form_data, ensure_ascii=False),
        files=json.dumps(new_files, ensure_ascii=False),
        remark=remark,
    )
    db.session.add(form)
    db.session.commit()
    return "created"


def save_or_update_form(request) -> str:
    email = g.current_user.email
    form_type = request.form.get('formType')
    remark = request.form.get('remark')

    if not email or not form_type:
        raise ValueError("Missing email or formType")

    # 校验表单类型
    if FormType.is_valid(form_type) is False:
        raise ValueError("Invalid form type: {}".format(form_type))

    # 处理字段
    form_data = request.form.to_dict(flat=False)
    for key, value in form_data.items():
        if not key.endswith("[]") and isinstance(value, list) and len(value) == 1:
            form_data[key] = value[0]
    form_data.pop('formType', None)
    form_data.pop('remark', None)

    # 处理文件上传
    folder = os.path.join(UploadConfig.UPLOAD_FOLDER, email_to_folder(email))
    new_files = handle_file_uploads(request.files, folder)

    # 处理空字段: 移除不保存
    for key in list(form_data.keys()):
        value = form_data[key]
        if value is None or (isinstance(value, str) and value.strip() == ""):
            form_data.pop(key)

    # 查询是否已有记录
    form = StandardForm.query.filter_by(email=email, form_type=form_type).first()

    if form:
        # 合并旧文件路径（只替换新提交字段）
        old_files = json.loads(form.files or "{}")
        merged_files = {**old_files, **new_files}
        form.form_data = json.dumps(form_data, ensure_ascii=False)
        form.files = json.dumps(merged_files, ensure_ascii=False)
        form.remark = remark
        db.session.commit()
        return "updated"
    else:
        form = StandardForm(
            email=email,
            form_type=form_type,
            form_data=json.dumps(form_data, ensure_ascii=False),
            files=json.dumps(new_files, ensure_ascii=False),
            remark=remark,
        )
        db.session.add(form)
        db.session.commit()
        return "created"


def get_latest_form(form_type: str, email: str) -> StandardForm | None:
    """获取指定类型的最新表单记录

    Args:
        form_type: 表单类型
        email: 用户邮箱

    Returns:
        最新的表单记录或None
    """
    return (
        StandardForm.query
        .filter_by(form_type=form_type, email=email)
        .order_by(StandardForm.created_gmt.desc())
        .first()
    )


def query_forms(params):
    """根据条件查询表单"""
    query = StandardForm.query.filter_by(**params)
    return query.order_by(StandardForm.created_gmt.desc()).all()
