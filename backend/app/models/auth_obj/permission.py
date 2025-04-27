from datetime import datetime

from backend.app import db
from backend.app.models.basemodel import BaseModel


class UserPagePermission(BaseModel):
    __tablename__ = 'user_page_permissions'

    user_email = db.Column(db.String(255), nullable=False, comment='用户邮箱')
    page_path = db.Column(db.String(512), nullable=False, comment='页面路径')
    # grant_by = db.Column(db.String(255), nullable=True, comment='授权人邮箱')
    is_active = db.Column(db.Boolean, default=True, nullable=False, comment='是否有效')
    expired_at = db.Column(db.DateTime, nullable=True, default=datetime(9999, 12, 31, 23, 59, 59), comment='失效时间')
    notes = db.Column(db.Text, nullable=True, comment='备注')

    __table_args__ = (
        db.UniqueConstraint('user_email', 'page_path', name='uniq_user_page'),
    )
