from backend.app import create_app
from backend.app.models import db
from flask_security.utils import hash_password

# 创建 App 上下文
app = create_app()
app.app_context().push()

# 引用 user_datastore
user_datastore = app.user_datastore

# 确保角色存在
if not user_datastore.find_role('admin'):
    user_datastore.create_role(name='admin', description='管理员')

# 检查用户是否已存在
admin_email = 'admin@esayaussie.com'
admin_password = 'admin2025'

if not user_datastore.find_user(email=admin_email):
    user = user_datastore.create_user(
        email=admin_email,
        password=hash_password(admin_password),
        active=True
    )
    user_datastore.add_role_to_user(user, 'admin')
    db.session.commit()
    print("✅ 管理员账户已创建：", admin_email)
else:
    print("⚠️ 管理员账户已存在")
