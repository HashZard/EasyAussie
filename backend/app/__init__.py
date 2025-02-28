from flask import Flask
from backend.config.config import DatabaseConfig, BACKEND_ROOT
from backend.app.models import db, init_db  # 现在可以安全导入 db


def create_app():
    app = Flask(__name__)
    app.config.from_object(DatabaseConfig)

    # 初始化日志
    setup_logger()

    # 初始化数据库（延迟绑定）
    init_db(app)
    # migrate.init_app(app, db)
    print("Database initialized.")


    # 注册 Blueprint
    from backend.app.routes.inspect import inspect_bp
    app.register_blueprint(inspect_bp, url_prefix='/inspect')

    return app

import logging
from logging.handlers import RotatingFileHandler


def setup_logger():
    # 创建日志格式器
    formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s [%(filename)s:%(lineno)d]: %(message)s'
    )

    # 配置文件日志（使用 RotatingFileHandler）
    file_handler = RotatingFileHandler(
        BACKEND_ROOT+'/logs/app.log', maxBytes=10 * 1024 * 1024, backupCount=3  # 每个日志文件最大10MB，最多创建3个备份文件
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    # 配置控制台日志
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)  # 开发环境建议设置为DEBUG
    console_handler.setFormatter(formatter)

    # 创建根日志对象
    app_logger = logging.getLogger()
    app_logger.setLevel(logging.DEBUG)  # 设置全局日志等级为DEBUG
    app_logger.addHandler(file_handler)
    app_logger.addHandler(console_handler)

    return app_logger

