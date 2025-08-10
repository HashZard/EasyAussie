import uuid
from flask_security import UserMixin, RoleMixin
from sqlalchemy import and_

from backend.app import db
from backend.app.models.basemodel import BaseModel


class RolesUsers(db.Model):
    __tablename__ = 'roles_users'
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column(db.Integer(), db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer(), db.ForeignKey('role.id'))


class Role(BaseModel, RoleMixin):
    __tablename__ = 'role'

    code = db.Column(db.String(80), unique=True, nullable=False)  # 角色代码（原name）
    display_name = db.Column(db.String(100), nullable=False)      # 显示名称
    description = db.Column(db.String(255))                      # 描述
    parent_role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)  # 父角色
    level = db.Column(db.Integer, default=0)                     # 角色等级（0最高）
    is_active = db.Column(db.Boolean, default=True)              # 是否激活
    color = db.Column(db.String(20), default='blue')             # 显示颜色
    icon = db.Column(db.String(50), default='fas fa-circle')     # 图标
    
    # 自关联关系
    parent = db.relationship('Role', remote_side='Role.id', backref='children')
    
    @property
    def name(self):
        """为了兼容Flask-Security，保留name属性"""
        return self.code
    
    def get_all_inherited_roles(self):
        """获取所有继承的角色（包括自己），按等级排序"""
        roles = [self]
        current = self.parent
        while current and current.is_active:
            roles.append(current)
            current = current.parent
        return sorted(roles, key=lambda x: x.level)
    
    def get_inherited_role_codes(self):
        """获取所有继承的角色代码"""
        return [role.code for role in self.get_all_inherited_roles()]
    
    def has_permission_of(self, role_code):
        """检查是否有指定角色的权限（考虑继承）"""
        return role_code in self.get_inherited_role_codes()
    
    def is_superior_to(self, other_role):
        """检查是否比另一个角色等级更高"""
        if isinstance(other_role, str):
            other_role = Role.query.filter_by(code=other_role).first()
        return other_role and self.level < other_role.level
    
    def can_manage_role(self, target_role_code):
        """检查是否可以管理指定角色（只能管理等级更低的角色）"""
        target_role = Role.query.filter_by(code=target_role_code).first()
        return target_role and self.level < target_role.level
    
    @staticmethod
    def get_role_hierarchy():
        """获取完整的角色层次结构"""
        all_roles = Role.query.filter_by(is_active=True).order_by(Role.level).all()
        hierarchy = {}
        
        for role in all_roles:
            if role.parent_role_id is None:
                hierarchy[role.code] = {
                    'role': role.to_dict(),
                    'children': Role._build_role_tree(role, all_roles)
                }
        return hierarchy
    
    @staticmethod
    def _build_role_tree(parent_role, all_roles):
        """递归构建角色树"""
        children = {}
        for role in all_roles:
            if role.parent_role_id == parent_role.id:
                children[role.code] = {
                    'role': role.to_dict(),
                    'children': Role._build_role_tree(role, all_roles)
                }
        return children
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'code': self.code,
            'display_name': self.display_name,
            'description': self.description,
            'level': self.level,
            'parent_role_id': self.parent_role_id,
            'parent_code': self.parent.code if self.parent else None,
            'is_active': self.is_active,
            'color': self.color,
            'icon': self.icon,
            'inherited_roles': self.get_inherited_role_codes(),
            'created_at': self.created_gmt.isoformat() if self.created_gmt else None
        }


class User(BaseModel, UserMixin):
    __tablename__ = 'user'

    email = db.Column(db.String(128), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean(), default=True)
    
    # 个人信息字段
    name = db.Column(db.String(100), nullable=True)
    wechat_nickname = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    avatar = db.Column(db.String(255), nullable=True)
    last_login_at = db.Column(db.DateTime, nullable=True)
    
    roles = db.relationship('Role', secondary='roles_users',
                            backref=db.backref('users', lazy='dynamic'))

    fs_uniquifier = db.Column(db.String(64), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    
    def get_display_name(self):
        """获取显示名称"""
        return self.name or self.wechat_nickname or self.email.split('@')[0]
    
    def has_role(self, role_code):
        """检查用户是否有指定角色权限（考虑继承）"""
        for user_role in self.roles:
            if user_role.has_permission_of(role_code):
                return True
        return False
    
    def get_role_codes(self):
        """获取用户直接分配的角色代码"""
        return [role.code for role in self.roles if role.is_active]
    
    def get_all_permissions(self):
        """获取用户的所有权限（包括继承的）"""
        all_permissions = set()
        for role in self.roles:
            if role.is_active:
                all_permissions.update(role.get_inherited_role_codes())
        return list(all_permissions)
    
    def get_highest_role(self):
        """获取用户的最高等级角色"""
        if not self.roles:
            return None
        active_roles = [role for role in self.roles if role.is_active]
        if not active_roles:
            return None
        return min(active_roles, key=lambda x: x.level)
    
    def can_manage_user(self, target_user):
        """检查是否可以管理目标用户（需要比目标用户的最高角色等级更高）"""
        self_highest = self.get_highest_role()
        target_highest = target_user.get_highest_role()
        
        if not self_highest:
            return False
        if not target_highest:
            return True
            
        return self_highest.level < target_highest.level
    
    def update_last_login(self):
        """更新最后登录时间"""
        from datetime import datetime
        self.last_login_at = datetime.utcnow()
    
    def to_dict(self):
        """转换为字典格式"""
        highest_role = self.get_highest_role()
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'wechat_nickname': self.wechat_nickname,
            'phone': self.phone,
            'avatar': self.avatar,
            'active': self.active,
            'roles': self.get_role_codes(),
            'all_permissions': self.get_all_permissions(),
            'highest_role': highest_role.code if highest_role else None,
            'highest_role_level': highest_role.level if highest_role else None,
            'created_at': self.created_gmt.isoformat() if self.created_gmt else None,
            'updated_at': self.updated_gmt.isoformat() if self.updated_gmt else None,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None
        }
