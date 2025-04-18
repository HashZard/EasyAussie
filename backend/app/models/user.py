from enum import Enum

from sqlalchemy import Enum as SqlEnum

from backend.app import db
from backend.app.models.basemodel import BaseModel


class UserType(Enum):
    USER = "user"
    ADMIN = "admin"


class User(BaseModel):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(128), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    role = db.Column(SqlEnum(UserType), default=UserType.USER, nullable=False)
