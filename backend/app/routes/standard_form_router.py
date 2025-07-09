import logging
from flask import Blueprint, request, jsonify, g

from backend.app.models.service_obj.standard_form import FormType
from backend.app.services import standard_form_handler, inspection_handler, transfer_handler
from backend.app.utils.auth_utils import token_required

standard_form = Blueprint('standard_form', __name__, url_prefix='/api')
app_logger = logging.getLogger('app_logger')


@standard_form.route('/form-submit', methods=['POST'])
@token_required
def standard_submit():
    form_type_str = request.form.get('formType')  # camelCase，不再做转换

    if not form_type_str:
        app_logger.error("[SUBMIT] 提交失败：缺少 formType 或 email")
        return jsonify({'error': 'Invalid form type or email'}), 400

    app_logger.info(f"[SUBMIT] 表单类型: {form_type_str} | 用户邮箱: {g.current_user.email}")

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


@standard_form.route('/form-latest', methods=['GET'])
@token_required
def get_latest_form():
    form_type = request.args.get('type')
    email = g.current_user.email

    if not form_type or not FormType.is_valid(form_type):
        app_logger.error("[LATEST] 获取失败：无效的表单类型")
        return jsonify({'error': 'Invalid form type'}), 400

    try:
        latest_form = standard_form_handler.get_latest_form(form_type, email)
        if latest_form:
            return jsonify({'status': 'success', 'data': latest_form.form_data})
        return jsonify({'status': 'success', 'data': None})
    except Exception as e:
        app_logger.exception(f"[LATEST] 获取最新记录失败: {e}")
        return jsonify({'error': 'Server error'}), 500


@standard_form.route('/form-query', methods=['GET'])
@token_required
def query_forms():
    # 获取查询参数
    form_type = request.args.get('type')
    status = request.args.get('status')
    email = g.current_user.email

    app_logger.info(f"[QUERY] 查询表单 | 用户: {email} | 类型: {form_type} | 状态: {status}")

    try:
        # 构建查询条件
        query_params = {'email': email}

        if form_type and FormType.is_valid(form_type):
            query_params['form_type'] = form_type

        if status:
            query_params['status'] = status

        # 调用 handler 执行查询
        forms = standard_form_handler.query_forms(query_params)

        # 转换为前端所需格式
        result = []
        for form in forms:
            result.append({
                'id': form.id,
                'formType': form.form_type,
                # 'status': form.status,
                'createTime': form.created_gmt.isoformat(),
                'updateTime': form.updated_gmt.isoformat() if form.updated_gmt else None,
                'formData': form.form_data
            })

        app_logger.info(f"[QUERY] 查询成功，返回 {len(result)} 条记录")
        return jsonify({
            'status': 'success',
            'data': result
        })

    except Exception as e:
        app_logger.exception(f"[QUERY] 查询失败: {e}")
        return jsonify({'error': 'Server error'}), 500
