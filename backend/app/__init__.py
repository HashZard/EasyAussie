from flask import Flask, request
from backend.config.config import DatabaseConfig, LoggerConfig
from backend.app.models import db, init_db  # 现在可以安全导入 db


def create_app():
    app = Flask(__name__)
    app.config.from_object(DatabaseConfig)

    # 初始化日志
    loggers = setup_logger()
    app_logger = loggers['app_logger']

    @app.before_request
    def before_request():
        app_logger.info(f"Request: {request.method} {request.path}")

    @app.after_request
    def after_request(response):
        app_logger.info(f"Response: {response.status}")
        return response

    # 初始化数据库（延迟绑定）
    init_db(app)
    print("Database initialized.")

    # 注册 Blueprint
    from backend.app.routes.inspect import inspect_bp
    app.register_blueprint(inspect_bp, url_prefix='/inspect')

    return app

import logging
from logging.handlers import RotatingFileHandler


def setup_logger():
    loggers = {
        'app_logger': create_logger('app_logger', LoggerConfig.APP_LOG_FILE, logging.DEBUG),
        'db_logger': create_logger('db_logger', LoggerConfig.DB_LOG_FILE, logging.INFO)
    }

    return loggers

def create_logger(logger_name, log_file, log_level):
    # 创建日志格式器
    formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s [%(filename)s:%(lineno)d]: %(message)s'
    )

    file_handler = RotatingFileHandler(log_file,
                                       maxBytes=LoggerConfig.LOG_MAX_BYTES, backupCount=LoggerConfig.LOG_BACKUP_COUNT)
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)
    # 配置控制台日志
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)  # 开发环境建议设置为DEBUG
    console_handler.setFormatter(formatter)
    # 创建根日志对象
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.DEBUG)  # 设置全局日志等级为DEBUG
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    logger.propagate = False

    return logger

