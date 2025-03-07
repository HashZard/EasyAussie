from datetime import datetime

from backend.app import db
from backend.app.models.basemodel import BaseModel


class User(BaseModel):
    __tablename__ = "users"  # 指定数据库表名

    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def __init__(self, username, email):
        self.username = username
        self.email = email

class RegisterInfo(BaseModel):
    __tablename__ = 'register_info'

    publisher_id = db.Column(db.Integer, nullable=True)
    property_add = db.Column(db.String(255),  nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    name = db.Column(db.String(64),  nullable=False)
    email = db.Column(db.String(64),  nullable=False)
    phone = db.Column(db.String(32),  nullable=True)
    checklist = db.Column(db.String(1024), nullable=True)

    def __init__(self, publisher_id=None, property_add=None, appointment_date=None, name=None, email=None, phone=None,
                 notice=None, data=None):
        """
        如果传递 data 参数，则根据用户输入的 JSON 数据生成对象。
        """
        if data:
            self.publisher_id = data.get('publisher_id')
            self.property_add = data.get('property_add')
            appointment_date = data.get('appointment_date', None)
            # 确保 `appointment_date` 是 `datetime` 对象
            if isinstance(appointment_date, str):
                self.appointment_date = datetime.strptime(appointment_date, "%Y-%m-%dT%H:%M")
            else:
                self.appointment_date = appointment_date
            self.name = data.get('name')
            self.email = data.get('email')
            self.phone = data.get('phone')
            # 将 'checklist' 字段由列表转换为换行符分隔的字符串
            checklist_items = data.get('checklist', [])
            self.checklist = "\n".join(checklist_items) if isinstance(checklist_items, list) else ""
        else:
            self.publisher_id = publisher_id
            self.property_add = property_add
            # 确保 `appointment_date` 是 `datetime` 对象
            if isinstance(appointment_date, str):
                self.appointment_date = datetime.strptime(appointment_date, "%Y-%m-%d %H:%M:%S")
            else:
                self.appointment_date = appointment_date
            self.name = name
            self.email = email
            self.phone = phone
            self.checklist = notice