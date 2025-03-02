from flask import current_app, Blueprint, request, send_from_directory
from backend.app.models.register import RegisterInfo
from backend.app.models import db
from backend.app.services.google_tasks import create_google_task
from backend.config.config import FRONTEND_ROOT

import logging

inspect_bp = Blueprint('inspect', __name__)

app_logger = logging.getLogger('app_logger')

@inspect_bp.route('/')
def home():
    return send_from_directory(FRONTEND_ROOT, 'index.html')

@inspect_bp.route('/submit', methods=['POST'])
def submit():
    app_logger.info("Submit endpoint accessed.")  # 记录访问
    data = request.get_json()
    register_info = RegisterInfo(
        publisher_id=data['publisher_id'],
        property_add=data['property_add'],
        appointment_date=data['appointment_date'],
        name=data['name'],
        email=data['email'],
        phone=data.get('phone'),
        notice=data.get('notice')
    )
    register_info.save()

    create_google_task(register_info)
    app_logger.info(f'Create Google Task for {register_info.name}')
    return 'OK'




