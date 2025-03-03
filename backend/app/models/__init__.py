from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = None  # 初始化 Flask-Migrate

def init_db(app):
    db.init_app(app)
    global migrate  # 使用全局变量
    migrate = Migrate(app, db)
    with app.app_context():
        db.create_all()