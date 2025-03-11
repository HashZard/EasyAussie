import logging

from backend.app import db

db_logger = logging.getLogger('db_logger')
db_logger.propagate = False  # 防止日志消息传播到根日志记录器

class BaseModel(db.Model):
    __abstract__ = True  # 表示这是一个抽象基类，不会创建对应的表

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    created_gmt = db.Column(db.DateTime, server_default=db.func.now())
    updated_gmt = db.Column(db.DateTime, server_default=db.func.now(), server_onupdate=db.func.now())


    def to_dict(self):
        """将模型对象转换为字典"""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    def __repr__(self):
        """返回模型对象的字符串表示"""
        return f"<{self.__class__.__name__} {self.to_dict()}>"

    def save(self):
        db.session.add(self)
        try:
            db.session.commit()
            db_logger.info(f"Data inserted into database: {self}")
            return True
        except Exception as e:
            db.session.rollback()
            db_logger.error(f"Database insertion failed: {str(e)}")
            return False