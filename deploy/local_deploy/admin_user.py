# create_admin_user.py

from backend.app import create_app
from backend.app.models import db
from backend.app.models.auth_obj.user import User, Role
from flask_security import hash_password

def main():
    app = create_app()
    with app.app_context():
        email = "admin@example.com"
        password = "admin2025"

        existing = User.query.filter_by(email=email).first()
        if existing:
            print(f"⚠️ 管理员账户 {email} 已存在")
            return

        # 确保admin角色存在
        admin_role = Role.query.filter_by(name='admin').first()
        if not admin_role:
            admin_role = Role(name='admin', description='管理员')
            db.session.add(admin_role)
            db.session.commit()
            print("✅ 创建了admin角色")

        # 创建管理员用户
        hashed_pw = hash_password(password)
        admin = User(email=email, password=hashed_pw, active=True)
        admin.roles.append(admin_role)

        db.session.add(admin)
        db.session.commit()
        print(f"✅ 管理员账户 {email} 创建成功，密码: {password}")

if __name__ == "__main__":
    main()
