from flask import current_app, Blueprint, request, send_from_directory
from backend.app.models.register import RegisterInfo
from backend.app.services.google_tasks import create_google_task
from backend.config.config import FRONTEND_ROOT

inspect_bp = Blueprint('inspect', __name__)

@inspect_bp.route('/')
def home():
    return send_from_directory(FRONTEND_ROOT, 'index.html')

@inspect_bp.route('/submit', methods=['POST'])
def submit():
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
    create_google_task(register_info)
    current_app.logger.info(f'Create Google Task for {register_info.name}')
    return 'OK'




