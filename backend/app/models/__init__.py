from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
db = SQLAlchemy()
migrate = Migrate(app, db)  # 初始化 Flask-Migrate

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()