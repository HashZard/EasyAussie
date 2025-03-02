from datetime import datetime

from backend.app import db
from backend.app.models.basemodel import BaseModel


class User(BaseModel):
    __tablename__ = "users"  # 指定数据库表名

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def __init__(self, username, email):
        self.username = username
        self.email = email

class RegisterInfo(BaseModel):
    __tablename__ = 'register_info'

    id = db.Column(db.Integer, primary_key=True)
    publisher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    property_add = db.Column(db.String(255),  nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    name = db.Column(db.String(64),  nullable=False)
    email = db.Column(db.String(64),  nullable=False)
    phone = db.Column(db.String(32),  nullable=True)
    notice = db.Column(db.String(1024),  nullable=True)

    def __init__(self, publisher_id, property_add, appointment_date, name, email, phone, notice):
        self.publisher_id = publisher_id
        self.property_add = property_add
        # 确保 `appointment_date` 是 `datetime` 对象
        if isinstance(appointment_date, str):
            self.appointment_date = datetime.strptime(appointment_date, "%Y-%m-%d %H:%M:%S")
        else:
            self.appointment_date = appointment_date  # 直接存入 `datetime`
        self.name = name
        self.email = email
        self.phone = phone
        self.notice = notice
