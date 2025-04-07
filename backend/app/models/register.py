import json

from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError

from backend.app import db
from backend.app.models.basemodel import BaseModel, db_logger


class RegisterInfo(BaseModel):
    __tablename__ = 'register_info'

    publisher_id = db.Column(db.Integer, nullable=True)
    property_add = db.Column(db.String(255), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    name = db.Column(db.String(64), nullable=False)
    email = db.Column(db.String(64), nullable=False)
    phone = db.Column(db.String(32), nullable=True)
    checklist = db.Column(db.String(1024), nullable=True)

    def __init__(self, publisher_id=None, property_add=None, appointment_date=None, name=None, email=None, phone=None,
                 checklist=None, data=None):
        """
        如果传递 data 参数，则根据用户输入的 JSON 数据生成对象。
        """
        if data:
            self.publisher_id = data.get('publisher_id')
            self.property_add = data.get('property_add')
            self.appointment_date = datetime.strptime(data.get('appointment_date'), "%Y-%m-%dT%H:%M")
            self.name = data.get('name')
            self.email = data.get('email')
            self.phone = data.get('phone')
            self.checklist = json.dumps(data.get('checklist'))
        else:
            self.publisher_id = publisher_id
            self.property_add = property_add
            # 确保 `appointment_date` 是 `datetime` 对象
            self.appointment_date = datetime.strptime(appointment_date, "%Y-%m-%dT%H:%M")
            self.name = name
            self.email = email
            self.phone = phone
            self.checklist = json.dumps(data.get('checklist'))


def get_latest_data_by_email(email):
    """
    get the latest data from the database based on the email in the Cookie.

    Returns:
        - success: return the latest data from database in JSON format.
        - error: return error message in JSON format.
    """
    try:
        if not email:
            db_logger.info("get_latest_data_by_email: input email is None")
            return

        # query the latest record from the database based on the email
        latest_record = RegisterInfo.query.filter_by(email=email) \
            .order_by(RegisterInfo.created_gmt.desc()) \
            .first()

        if not latest_record:
            db_logger.info("get_latest_data_by_email: no matching data found")
            return

        # 将记录序列化为JSON形式返回
        return latest_record

    except SQLAlchemyError as e:
        # 如果发生数据库错误，记录日志
        db_logger.error(f"get_latest_data_by_email: database query failed, error: {str(e)}")
        return
