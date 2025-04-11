import logging
import os
from datetime import datetime, timezone

from flask import jsonify
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from backend.app.models.register import RegisterInfo
from backend.app.utils import cookie_utils
from backend.config.config import GoogleTasksConfig

app_logger = logging.getLogger('app_logger')


def handle(req):
    data = req.form.to_dict()

    # 单独处理需要多个值的字段
    checklist = req.form.getlist("checklist[]")
    data["checklist"] = checklist

    register_info = RegisterInfo(data=data)
    register_info.save()

    create_google_task(register_info)
    return jsonify({"success": True, "message": "Task created successfully"}), 200


def reload_record():
    """
    get the latest data from the database based on the email in the Cookie.

    Returns:
        - success: return the latest data from database in JSON format.
        - error: return error message in JSON format.
    """
    pass

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


def create_google_task(register_info: RegisterInfo):
    """
    创建 Google 任务
    API文档: https://developers.google.com/tasks/reference/rest/v1/tasks?hl=zh-cn
    模板:
        标题: (代确认) {register_info.address}
        时间: {register_info.appointment_date}
        说明: Time: {register_info.appointment_date}
             Name: {register_info.name}
             Email: {register_info.email}
             Phone: {register_info.phone}
             Notes: {register_info.notice}
    """
    # Authenticate and create service
    service = authenticate_google_tasks()

    appointment_datetime = register_info.appointment_date
    if isinstance(appointment_datetime, datetime):
        due_string = (appointment_datetime.astimezone(timezone.utc).isoformat(timespec="milliseconds")
                      .replace("+00:00", "Z"))
    else:
        raise ValueError("appointmentDate must be a `datetime` object")

    task = {
        "title": f"(代确认) {register_info.property_add}",
        "notes": f"Time: {register_info.appointment_date}\n"
                 f"Name: {register_info.name}\n"
                 f"Email: {register_info.email}\n"
                 f"Phone: {register_info.phone}\n"
                 f"Notes: {register_info.checklist}",
        # Google Tasks 需要 ISO 8601 格式的 UTC 时间：2025-02-23T12:00:00.000Z
        # 只保留日期部分,去掉时间信息
        "due": due_string,
    }

    # Create task
    result = service.tasks().insert(tasklist=GoogleTasksConfig.TASKS_LIST_ID, body=task).execute()
    app_logger.info(f'Create Google Task for {register_info.name}, result: {result}')

    return result
