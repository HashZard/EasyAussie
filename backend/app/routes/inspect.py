import logging

from flask import Blueprint, request, send_from_directory
from datetime import datetime

from backend.app.models.register import RegisterInfo
from backend.app.services.google_tasks import create_google_task
from backend.config.config import FRONTEND_ROOT

inspect_bp = Blueprint('inspect', __name__)

app_logger = logging.getLogger('app_logger')

@inspect_bp.route('/')
def home():
    return send_from_directory(FRONTEND_ROOT, 'index.html')

@inspect_bp.route('/submit', methods=['POST'])
def submit():
    data = request.get_json()
    app_logger.info(f"Received data: {data}")  # 打印接收到的数据

    register_info = RegisterInfo(data = data)
    register_info.save()

    create_google_task(register_info)
    app_logger.info(f'Create Google Task for {register_info.name}')
    return 'OK'




