from backend.app import db
from backend.app.models.basemodel import BaseModel


class Permission(BaseModel):
    __tablename__ = 'permissions'

    code = db.Column(db.String(64), unique=True, nullable=False)  # e.g. 'EDIT_USER', 'DELETE_FORM'
    description = db.Column(db.String(255))
