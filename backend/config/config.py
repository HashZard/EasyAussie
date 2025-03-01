import os
import platform

# 自动检测当前运行环境
def detect_environment():
    """ 自动检测是本地开发还是服务器环境 """
    if platform.system() == "Linux" and not os.getenv("DISPLAY"):
        return "production"  # 服务器环境（Linux 无 GUI）
    return "local"  # 本地环境（Mac/Windows/Linux GUI）

APP_ENV = detect_environment()
print(f"🌍 当前环境: {APP_ENV}")

# 计算项目根目录路径
BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CONFIG_ROOT = os.path.dirname(__file__)
FRONTEND_ROOT = os.path.abspath(os.path.join(BACKEND_ROOT, '../frontend'))


# Google Tasks 配置
class GoogleTasksConfig:
    SCOPES = ['https://www.googleapis.com/auth/tasks']
    TASKS_LIST_ID = "@default"

    if APP_ENV == "production":
        SERVICE_ACCOUNT_FILE = os.path.join(CONFIG_ROOT, 'inspect_web_client_cred.json')
        TOKEN_FILE = "/etc/google_tasks/token.json"
    else:
        SERVICE_ACCOUNT_FILE = os.path.join(CONFIG_ROOT, 'inspect_desktop_client_cred.json')
        TOKEN_FILE = os.path.expanduser("~/.config/google_tasks/token.json")

    print(f"✅ Google Tasks 配置: {APP_ENV}")
    print(f"🔑 认证文件: {SERVICE_ACCOUNT_FILE}")
    print(f"🗂 Token 文件: {TOKEN_FILE}")

# 数据库配置 SQLite
class DatabaseConfig:
    # SQLite 数据库路径
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BACKEND_ROOT, 'app.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

# 日志配置
class LoggerConfig:

    if APP_ENV == "production":
        LOG_FILE = "/var/log/inspect/app.log"
    else:
        LOG_FILE = os.path.join(BACKEND_ROOT, 'logs/app.log')
    LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 3


if __name__ == "__main__":
    print("地址:" + DatabaseConfig.SQLALCHEMY_DATABASE_URI)
