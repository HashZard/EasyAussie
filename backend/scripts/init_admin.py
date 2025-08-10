#!/usr/bin/env python3
"""
初始化管理员账户脚本
创建根级管理员角色和管理员用户
"""

import sys
import os

# 添加项目根目录到路径
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from backend.app import create_app
from backend.app.models import db
from backend.app.models.auth_obj.user import User, Role
from flask_security.utils import hash_password

def init_admin():
    """初始化管理员角色和账户"""
    
    # 创建 App 上下文
    app = create_app()
    
    with app.app_context():
        print("🔧 检查管理员角色和账户...")
        
        try:
            # 1. 检查并创建管理员角色
            admin_role = Role.query.filter_by(code='admin').first()
            if not admin_role:
                print("   📝 创建管理员角色...")
                admin_role = Role(
                    code='admin',
                    display_name='系统管理员',
                    description='系统最高权限管理员，拥有所有权限',
                    level=0,  # 最高等级
                    is_active=True,
                    color='red',
                    icon='fas fa-crown'
                )
                db.session.add(admin_role)
                db.session.commit()
                print("   ✅ 管理员角色已创建")
            else:
                print("   ✅ 管理员角色已存在")
            
            # 2. 检查并创建默认普通用户角色
            user_role = Role.query.filter_by(code='user').first()
            if not user_role:
                print("   📝 创建普通用户角色...")
                user_role = Role(
                    code='user',
                    display_name='普通用户',
                    description='基础用户权限',
                    level=40,
                    is_active=True,
                    color='blue',
                    icon='fas fa-user'
                )
                db.session.add(user_role)
                db.session.commit()
                print("   ✅ 普通用户角色已创建")
            else:
                print("   ✅ 普通用户角色已存在")
            
            # 3. 检查并创建管理员用户
            admin_email = 'admin@easyaussie.com'
            admin_password = 'admin2025'
            
            admin_user = User.query.filter_by(email=admin_email).first()
            if not admin_user:
                print("   👤 创建管理员用户...")
                admin_user = User(
                    email=admin_email,
                    password=hash_password(admin_password),
                    active=True,
                    name='系统管理员'
                )
                admin_user.roles.append(admin_role)
                db.session.add(admin_user)
                db.session.commit()
                print(f"   ✅ 管理员账户已创建")
                print(f"      📧 邮箱: {admin_email}")
                print(f"      🔑 密码: {admin_password}")
            else:
                print("   ✅ 管理员用户已存在")
                # 确保管理员用户有admin角色
                if admin_role not in admin_user.roles:
                    admin_user.roles.append(admin_role)
                    db.session.commit()
                    print("   ✅ 已为现有管理员用户添加admin角色")
            
            # 4. 显示统计信息
            total_users = User.query.count()
            total_roles = Role.query.count()
            print(f"   📊 系统状态: {total_users} 个用户, {total_roles} 个角色")
            
            return True
            
        except Exception as e:
            print(f"   ❌ 初始化失败: {str(e)}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    success = init_admin()
    sys.exit(0 if success else 1)
