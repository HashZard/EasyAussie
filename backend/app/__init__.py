import secrets

from flask import Flask, request

from backend.config.config import AppConfig
from backend.app.models import db, init_db
from backend.app.models.auth_obj.user import User, Role
from flask_security import Security, SQLAlchemySessionUserDatastore

security = Security()
user_datastore = SQLAlchemySessionUserDatastore(db.session, User, Role)


def create_app():
    app = Flask(__name__)
    app.config.from_object(AppConfig)

    # 初始化日志
    loggers = setup_logger(app.config)
    app_logger = loggers['app_logger']

    @app.before_request
    def before_request():
        app_logger.info(f"Request: {request.method} {request.path}"
                        + f" with data: {request.get_json(silent=True)}")

    @app.after_request
    def after_request(response):
        app_logger.info(f"Response: {response.status}"
                        + f" with data: {response.get_json(silent=True)}")
        return response

    # 初始化数据库（延迟绑定）
    init_db(app)
    print("Database initialized.")

    # 初始化 Flask-Security-Too
    app.user_datastore = user_datastore

    # 注册 Blueprint
    from backend.app.routes.auth_router import auth_bp
    from backend.app.routes.standard_form_router import standard_form
    from backend.app.routes.admin_router import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(standard_form)
    app.register_blueprint(admin_bp)

    print("✅ 当前所有 app 路由:")
    for rule in app.url_map.iter_rules():
        print("➡", rule)

    # 设置 CSRF 保护
    app.secret_key = secrets.token_hex(32)

    return app


import logging
from logging.handlers import RotatingFileHandler


def setup_logger(config):
    loggers = {
        'app_logger': create_logger(
            name='app_logger',
            filepath=config['APP_LOG_FILE'],
            level=logging.DEBUG,
            max_bytes=config['LOG_MAX_BYTES'],
            backup_count=config['LOG_BACKUP_COUNT']
        ),
        'db_logger': create_logger(
            name='db_logger',
            filepath=config['DB_LOG_FILE'],
            level=logging.INFO,
            max_bytes=config['LOG_MAX_BYTES'],
            backup_count=config['LOG_BACKUP_COUNT']
        )
    }
    return loggers


def create_logger(name, filepath, level, max_bytes, backup_count):
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.propagate = False

    formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s [%(filename)s:%(lineno)d]: %(message)s'
    )

    file_handler = RotatingFileHandler(filepath, maxBytes=max_bytes, backupCount=backup_count)
    file_handler.setFormatter(formatter)
    file_handler.setLevel(level)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.DEBUG)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger

