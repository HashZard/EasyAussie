import os
import platform

# 自动检测当前运行环境
def detect_environment():
    """ 自动检测是本地开发还是服务器环境 """
    if platform.system() == "Linux" and not os.getenv("DISPLAY"):
        return "production"  # 服务器环境（Linux 无 GUI）
    return "local"  # 本地环境（Mac/Windows/Linux GUI）

APP_ENV = detect_environment()
print(f"🌍 Current environment: {APP_ENV}")

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

    print(f"✅ Google Tasks Config: {APP_ENV}")
    print(f"🔑 Service Account File: {SERVICE_ACCOUNT_FILE}")
    print(f"🗂 Token File: {TOKEN_FILE}")

# 数据库配置 SQLite
class DatabaseConfig:
    # SQLite 数据库路径
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BACKEND_ROOT, 'app.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

# 日志配置
class LoggerConfig:

    if APP_ENV == "production":
        APP_LOG_FILE = "/var/log/easyaussie/app.log"
        DB_LOG_FILE = "/var/log/easyaussie/database.log"
    else:
        APP_LOG_FILE = os.path.join(BACKEND_ROOT, 'logs/app.log')
        DB_LOG_FILE = os.path.join(BACKEND_ROOT, 'logs/database.log')
    # 每个日志文件最大10MB，最多创建3个备份文件
    LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 10

# 文件上传配置
class UploadConfig:
    UPLOAD_FOLDER = os.path.join(BACKEND_ROOT, 'uploads')
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

    # 如果目录不存在则创建
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    print(f"📂 Upload Folder: {UPLOAD_FOLDER}")

# ✅ Flask-Security-Too 配置整合
class SecurityConfig:
    SECRET_KEY = 'super-secret-key'
    SECURITY_PASSWORD_SALT = 'salt-salt'

    # ✅ 启用 token API
    SECURITY_API_ENABLED = True
    SECURITY_TOKEN_AUTHENTICATION_MODE = 'bearer'
    SECURITY_TOKEN_AUTHENTICATION_HEADER = 'Authorization'
    SECURITY_TOKEN_MAX_AGE = 3600

    # ✅ 可选配置
    SECURITY_JSON = True
    SECURITY_REGISTERABLE = True
    SECURITY_SEND_REGISTER_EMAIL = False
    SECURITY_LOGIN_WITHOUT_CONFIRMATION = True
    SECURITY_JOIN_USER_ROLES = True
    SECURITY_PASSWORD_SINGLE_HASH = True
    SECURITY_UNAUTHORIZED_VIEW = None  # 避免重定向

class AppConfig(GoogleTasksConfig, DatabaseConfig, LoggerConfig, UploadConfig, SecurityConfig):
    ENV = APP_ENV
    DEBUG = APP_ENV == "local"

if __name__ == "__main__":
    print("地址:" + DatabaseConfig.SQLALCHEMY_DATABASE_URI)
