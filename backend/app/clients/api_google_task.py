import logging
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from backend.config.config import GoogleTasksConfig

app_logger = logging.getLogger('app_logger')


def authenticate_google_tasks():
    creds = None
    CREDENTIALS_FILE = GoogleTasksConfig.SERVICE_ACCOUNT_FILE
    TOKEN_FILE = GoogleTasksConfig.TOKEN_FILE
    SCOPES = GoogleTasksConfig.SCOPES

    # Ensure the directory for the token file exists
    os.makedirs(os.path.dirname(TOKEN_FILE), exist_ok=True)

    """ 尝试加载存储的 Token """
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        app_logger.info("Token loaded.")

    # 令牌过期时自动刷新
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        app_logger.info("Token refreshed.")
        with open(TOKEN_FILE, "w") as token_file:
            token_file.write(creds.to_json())

    """ 使用 OAuth 2.0 认证用户 """
    if not creds or not creds.valid:
        app_logger.info("Token invalid. Requesting new token.")
        flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, scopes=SCOPES)
        creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as token_file:
            token_file.write(creds.to_json())

    return build("tasks", "v1", credentials=creds)


def create_google_task(task_body: dict):
    """
    创建 Google 任务
    API文档: https://developers.google.com/tasks/reference/rest/v1/tasks?hl=zh-cn
    """
    # Authenticate and create service
    service = authenticate_google_tasks()

    # Create task
    result = service.tasks().insert(tasklist=GoogleTasksConfig.TASKS_LIST_ID, body=task_body).execute()
    app_logger.info(f'Google Task created. Result: {result}')

    return result
