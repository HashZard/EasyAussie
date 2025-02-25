from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from backend.config.config import DatabaseConfig
from backend.app.routes.inspect import inspect_bp

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object(DatabaseConfig)


    # 初始化数据库和迁移工具
    db.init_app(app)
    migrate.init_app(app, db)

    # 注册 Blueprint
    app.register_blueprint(inspect_bp, url_prefix='/inspect')

    return app