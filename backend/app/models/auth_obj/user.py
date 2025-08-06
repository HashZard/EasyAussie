import uuid
from flask_security import UserMixin, RoleMixin

from backend.app import db
from backend.app.models.basemodel import BaseModel


class RolesUsers(db.Model):
    __tablename__ = 'roles_users'
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column(db.Integer(), db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer(), db.ForeignKey('role.id'))


class Role(BaseModel, RoleMixin):
    __tablename__ = 'role'

    # (default): 默认角色
    # admin: 管理员
    # paid1: coverletter
    # paid2: application
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))

class User(BaseModel, UserMixin):
    __tablename__ = 'user'

    email = db.Column(db.String(128), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean(), default=True)
    
    # 个人信息字段
    name = db.Column(db.String(100), nullable=True)  # 真实姓名
    wechat_nickname = db.Column(db.String(100), nullable=True)  # 微信昵称
    phone = db.Column(db.String(20), nullable=True)  # 联系电话
    avatar = db.Column(db.String(255), nullable=True)  # 头像URL
    last_login_at = db.Column(db.DateTime, nullable=True)  # 最后登录时间
    
    roles = db.relationship('Role', secondary='roles_users',
                            backref=db.backref('users', lazy='dynamic'))

    fs_uniquifier = db.Column(db.String(64), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    
    def get_display_name(self):
        """获取显示名称，优先使用真实姓名，其次微信昵称，最后使用邮箱"""
        return self.name or self.wechat_nickname or self.email.split('@')[0]
    
    def has_role(self, role_name):
        """检查用户是否有指定角色"""
        return any(role.name == role_name for role in self.roles)
    
    def get_role_names(self):
        """获取用户所有角色名称列表"""
        return [role.name for role in self.roles]
    
    def update_last_login(self):
        """更新最后登录时间"""
        from datetime import datetime
        self.last_login_at = datetime.utcnow()
    
    def to_dict(self):
        """转换为字典格式，用于API响应"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'wechatNickname': self.wechat_nickname,
            'phone': self.phone,
            'avatar': self.avatar,
            'active': self.active,
            'roles': self.get_role_names(),
            'createdAt': self.created_gmt.isoformat() if self.created_gmt else None,
            'updatedAt': self.updated_gmt.isoformat() if self.updated_gmt else None,
            'lastLoginAt': self.last_login_at.isoformat() if self.last_login_at else None
        }
