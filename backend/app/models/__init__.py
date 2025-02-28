from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()  # 创建 db 实例，但不立即绑定 app

# 让 app 先初始化，再注册所有模型，避免循环导入
def init_db(app):
    db.init_app(app)
    with app.app_context():
        from backend.app.models.register import RegisterInfo  # 这里延迟导入
        db.create_all()  # 确保数据库表被创建
