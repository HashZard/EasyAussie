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

    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))

class User(BaseModel, UserMixin):
    __tablename__ = 'user'

    email = db.Column(db.String(128), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean(), default=True)
    roles = db.relationship('Role', secondary='roles_users',
                            backref=db.backref('users', lazy='dynamic'))

    fs_uniquifier = db.Column(db.String(64), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
