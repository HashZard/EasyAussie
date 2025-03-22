import json
import os

from backend.app.models.form_submission import FormSubmission
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from backend.config.config import UploadConfig

inspect_bp = Blueprint('coverletter', __name__, url_prefix='/api/coverletter')

UPLOAD_FOLDER = UploadConfig.UPLOAD_FOLDER


@inspect_bp.route('/submit', methods=['POST'])
def submit_cover_letter():
    email = request.form.get('email')
    form_type = request.form.get('form_type', 'student')  # 你可以前端设置隐藏字段
    remark = request.form.get('remark', '')

    # 获取JSON数据字段
    form_data = {}
    for key in request.form:
        if key not in ['email', 'form_type', 'remark']:
            form_data[key] = request.form.get(key)

    # 处理上传文件（files）
    files_json = {}
    for file_key in request.files:
        file = request.files[file_key]
        if file and file.filename:
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            file.save(file_path)
            files_json[file_key] = file_path

    # 保存到数据库
    record = FormSubmission(
        email=email,
        form_type=form_type,
        form_data=json.dumps(form_data, ensure_ascii=False),
        files=json.dumps(files_json, ensure_ascii=False),
        remark=remark
    )

    record.save()

    return jsonify({'status': 'success'})
