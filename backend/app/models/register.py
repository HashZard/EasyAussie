from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"  # 指定数据库表名
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)


class RegisterInfo(db.Model):
    __tablename__ = "register_info"
    id = db.Column(db.Integer, primary_key=True)
    publisher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    property_add = db.Column(db.String(255),  nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    name = db.Column(db.String(64),  nullable=False)
    email = db.Column(db.String(64),  nullable=False)
    phone = db.Column(db.String(32),  nullable=True)
    notice = db.Column(db.String(1024),  nullable=True)
