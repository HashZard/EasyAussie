from backend.app import db
from backend.app.models.basemodel import BaseModel

class UserPermission(BaseModel):
    __tablename__ = "user_permissions"

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    permission_id = db.Column(db.Integer, db.ForeignKey('permissions.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
