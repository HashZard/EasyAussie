from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()  # 不要传 app，先创建空的 migrate 实例


def init_db(app):
    db.init_app(app)
    migrate.init_app(app, db)
