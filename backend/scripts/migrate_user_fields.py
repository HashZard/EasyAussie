#!/usr/bin/env python3
"""
用户表字段迁移脚本
添加 name, wechat_nickname, phone, avatar, last_login_at 字段
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from backend.app import create_app, db

def migrate_user_fields():
    """添加用户表新字段"""
    app = create_app()
    
    with app.app_context():
        try:
            # 检查表是否存在
            result = db.engine.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='user';"))
            if not result.fetchone():
                print("用户表不存在，创建所有表...")
                db.create_all()
                print("表创建完成")
                return
            
            # 检查字段是否已存在
            result = db.engine.execute(text("PRAGMA table_info(user);"))
            existing_columns = [row[1] for row in result.fetchall()]
            
            # 需要添加的字段
            new_fields = [
                ("name", "VARCHAR(100)"),
                ("wechat_nickname", "VARCHAR(100)"),
                ("phone", "VARCHAR(20)"),
                ("avatar", "VARCHAR(255)"),
                ("last_login_at", "DATETIME")
            ]
            
            # 添加不存在的字段
            for field_name, field_type in new_fields:
                if field_name not in existing_columns:
                    try:
                        db.engine.execute(text(f"ALTER TABLE user ADD COLUMN {field_name} {field_type};"))
                        print(f"成功添加字段: {field_name}")
                    except Exception as e:
                        print(f"添加字段 {field_name} 时出错: {e}")
                else:
                    print(f"字段 {field_name} 已存在，跳过")
            
            print("用户表字段迁移完成")
            
        except Exception as e:
            print(f"迁移过程中出错: {e}")
            db.session.rollback()

if __name__ == "__main__":
    migrate_user_fields()
