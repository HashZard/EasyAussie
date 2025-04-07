import hashlib
import json
import os

from werkzeug.utils import secure_filename

from backend.app.constants.form_type import FormType
from backend.app.models import db
from backend.app.models.standard_form import StandardForm
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


def save_or_update_form(request) -> str:
    email = request.form.get('email')
    form_type = request.form.get('formType')
    remark = request.form.get('remark')

    if not email or not form_type:
        raise ValueError("Missing email or formType")

    # 校验表单类型
    if FormType.is_valid_form_type(form_type) is False:
        raise ValueError("Invalid form type: {}".format(form_type))

    # 处理字段
    form_data = request.form.to_dict(flat=False)
    form_data.pop('formType', None)
    form_data.pop('remark', None)

    # 处理文件上传
    folder = os.path.join(UploadConfig.UPLOAD_FOLDER, email_to_folder(email))
    new_files = handle_file_uploads(request.files, folder)

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
        # 返回更新详情和文件数量
        return "created"
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
