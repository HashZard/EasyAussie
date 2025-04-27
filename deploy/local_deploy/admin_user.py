# create_admin_user.py

from backend.app import create_app
from backend.app.models import db
from backend.app.models.auth_obj.user import User, UserType
import bcrypt

def main():
    app = create_app()
    with app.app_context():
        email = "admin@example.com"
        password = "admin2025"

        existing = User.query.filter_by(email=email).first()
        if existing:
            print(f"⚠️ 管理员账户 {email} 已存在")
            return

        hashed_pw = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        admin = User(email=email, password=hashed_pw, role=UserType.ADMIN)

        db.session.add(admin)
        db.session.commit()
        print(f"✅ 管理员账户 {email} 创建成功")

if __name__ == "__main__":
    main()
