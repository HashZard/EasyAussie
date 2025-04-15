import logging
from flask import Blueprint, request, jsonify
from backend.app.services import standard_form_handler, inspection_handler, transfer_handler
from backend.app.constants.form_type import FormType

standard_form = Blueprint('standard_form', __name__, url_prefix='/api')
app_logger = logging.getLogger('app_logger')


@standard_form.route('/form-submit', methods=['POST'])
def standard_submit():
    form_type_str = request.form.get('formType')  # camelCase，不再做转换
    email = request.form.get("email")

    if not form_type_str or not email:
        app_logger.error("[SUBMIT] 提交失败：缺少 formType 或 email")
        return jsonify({'error': 'Invalid form type or email'}), 400

    app_logger.info(f"[SUBMIT] 表单类型: {form_type_str} | 用户邮箱: {email}")

    if request.files:
        file_list = [f.filename for f in request.files.values()]
        app_logger.info(f"[SUBMIT] 上传文件: {file_list}")
    else:
        app_logger.info("[SUBMIT] 无上传文件")

    try:
        # 保存或更新数据库记录
        action = standard_form_handler.save_or_update_form(request)

        # Post-Save Hook：针对部分表单执行额外操作
        if FormType.is_valid(form_type_str):
            form_type = FormType.from_str(form_type_str)
            if form_type == FormType.INSPECTION:
                inspection_handler.handle(request)
            elif form_type == FormType.AIRPORT_PICKUP:
                transfer_handler.handle(request)

        app_logger.info(f"[SUBMIT] 表单处理成功：{action}")
        return jsonify({'status': 'success', 'action': action})
    except Exception as e:
        app_logger.exception(f"[SUBMIT] 表单保存失败: {e}")
        return jsonify({'error': 'Server error'}), 500
