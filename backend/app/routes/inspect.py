import logging

from flask import Blueprint, request, jsonify

from backend.app.models.register import RegisterInfo
from backend.app.services.google_tasks import create_google_task
from backend.app.utils import cookie_utils

inspect_bp = Blueprint('inspect', __name__, url_prefix='/api/inspect')

app_logger = logging.getLogger('app_logger')

@inspect_bp.route('/submit', methods=['POST'])
def submit():
    data = request.get_json()
    app_logger.info(f"Received data: {data}")  # 打印接收到的数据

    register_info = RegisterInfo(data=data)
    register_info.save()

    create_google_task(register_info)
    app_logger.info(f'Create Google Task for {register_info.name}')
    return jsonify({"success": True, "message": "Task created successfully"}), 200


@inspect_bp.route('/latest', methods=['GET'])
def get_latest_data_by_email():
    """
    get the latest data from the database based on the email in the Cookie.

    Returns:
        - success: return the latest data from database in JSON format.
        - error: return error message in JSON format.
    """

    email = cookie_utils.get_email_from_cookie()
    if not email:
        return jsonify({"error": "Cookie中未找到邮箱"}), 400

    latest_record = RegisterInfo.get_latest_data_by_email(email)
    if latest_record:
        return jsonify({"success": True, "data": latest_record.to_dict()}), 200
    else:
        return jsonify({"error": "未找到数据"}), 404
