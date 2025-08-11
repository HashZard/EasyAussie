#!/usr/bin/env python3
"""
增强Flask应用的现有日志配置
将原有的RotatingFileHandler改为TimedRotatingFileHandler以支持按天分割
"""
import os
import sys
import re

def update_flask_app():
    """增强Flask应用的现有日志配置，不添加重复配置"""
    
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    app_init_file = os.path.join(project_root, 'backend', 'app', '__init__.py')
    
    if not os.path.exists(app_init_file):
        print(f"错误: Flask应用初始化文件不存在: {app_init_file}")
        return False
    
    # 读取现有内容
    with open(app_init_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否已经使用了TimedRotatingFileHandler
    if 'TimedRotatingFileHandler' in content:
        print("日志配置已是按天轮转，无需更新")
        return True
    
    # 检查是否存在原有的日志配置
    if 'RotatingFileHandler' not in content:
        print("未找到原有的日志配置，无法更新")
        return False
    
    print("发现原有日志配置，正在升级为按天轮转...")
    
    # 1. 更新import语句，添加TimedRotatingFileHandler
    import_pattern = r'from logging\.handlers import RotatingFileHandler'
    import_replacement = 'from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler'
    
    if 'TimedRotatingFileHandler' not in content:
        content = re.sub(import_pattern, import_replacement, content)
        print("✅ 已添加TimedRotatingFileHandler导入")
    
    # 2. 更新create_logger函数，将RotatingFileHandler改为TimedRotatingFileHandler
    # 查找并替换create_logger函数中的file_handler创建部分
    old_handler_pattern = r'file_handler = RotatingFileHandler\(filepath, maxBytes=max_bytes, backupCount=backup_count\)'
    new_handler_pattern = '''file_handler = TimedRotatingFileHandler(
        filepath,
        when='midnight',
        interval=1,
        backupCount=backup_count,
        encoding='utf-8'
    )
    file_handler.suffix = "%Y%m%d"'''
    
    if 'TimedRotatingFileHandler(' not in content:
        content = re.sub(old_handler_pattern, new_handler_pattern, content)
        print("✅ 已将文件处理器更新为按天轮转")
    
    # 3. 确保日志目录使用生产环境路径
    # 检查配置文件中是否需要更新日志路径
    config_file = os.path.join(project_root, 'backend', 'config', 'config.py')
    if os.path.exists(config_file):
        print("🔧 检查配置文件中的日志路径...")
        update_config_paths(config_file)
    
    # 写回文件
    with open(app_init_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ 已增强Flask应用日志配置: {app_init_file}")
    print("📝 日志现在将按天轮转，保留指定天数的备份")
    return True

def update_config_paths(config_file):
    """更新配置文件中的日志路径为生产环境路径"""
    
    with open(config_file, 'r', encoding='utf-8') as f:
        config_content = f.read()
    
    updated = False
    
    # 更新日志路径为生产环境路径
    log_path_patterns = [
        (r"'APP_LOG_FILE':\s*['\"][^'\"]*['\"]", "'APP_LOG_FILE': '/var/log/easyaussie/app/app.log'"),
        (r"'DB_LOG_FILE':\s*['\"][^'\"]*['\"]", "'DB_LOG_FILE': '/var/log/easyaussie/app/database.log'"),
        (r'"APP_LOG_FILE":\s*[\'"][^\'"]*[\'"]', '"APP_LOG_FILE": "/var/log/easyaussie/app/app.log"'),
        (r'"DB_LOG_FILE":\s*[\'"][^\'"]*[\'"]', '"DB_LOG_FILE": "/var/log/easyaussie/app/database.log"'),
    ]
    
    for pattern, replacement in log_path_patterns:
        if re.search(pattern, config_content):
            config_content = re.sub(pattern, replacement, config_content)
            updated = True
    
    # 确保日志备份数量合理（30天）
    backup_patterns = [
        (r"'LOG_BACKUP_COUNT':\s*\d+", "'LOG_BACKUP_COUNT': 30"),
        (r'"LOG_BACKUP_COUNT":\s*\d+', '"LOG_BACKUP_COUNT": 30'),
    ]
    
    for pattern, replacement in backup_patterns:
        if re.search(pattern, config_content):
            config_content = re.sub(pattern, replacement, config_content)
            updated = True
    
    if updated:
        with open(config_file, 'w', encoding='utf-8') as f:
            f.write(config_content)
        print("✅ 已更新配置文件中的日志路径")
    else:
        print("ℹ️ 配置文件无需更新")

if __name__ == '__main__':
    success = update_flask_app()
    sys.exit(0 if success else 1)
