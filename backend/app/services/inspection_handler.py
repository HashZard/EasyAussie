import json
import logging
from datetime import datetime, timezone

from flask import jsonify

from backend.app.clients.api_google_task import create_google_task
from backend.app.models.service_obj.inspection_obj import RegisterInfo

app_logger = logging.getLogger('app_logger')


def handle(req):
    data = req.form.to_dict()

    # 单独处理需要多个值的字段
    checklist = req.form.getlist("checklist[]")
    data["checklist"] = checklist

    register_info = RegisterInfo(data=data)
    register_info.save()

    create_google_task(create_task_body(register_info))

    return jsonify({"success": True, "message": "Task created successfully"}), 200


def reload_record():
    """
    get the latest data from the database based on the email in the Cookie.

    Returns:
        - success: return the latest data from database in JSON format.
        - error: return error message in JSON format.
    """
    pass


def create_task_body(register_info: RegisterInfo):
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
    appointment_datetime = register_info.appointment_date

    if not isinstance(appointment_datetime, datetime):
        raise ValueError("appointment_date must be a `datetime` object")

    due_string = (
        appointment_datetime.astimezone(timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )

    return {
        "title": f"(代确认) {register_info.property_add}",
        "notes": f"Time: {register_info.appointment_date}\n\n"
                 f"Name: {register_info.name}\n"
                 f"Email: {register_info.email}\n"
                 f"Phone: {register_info.phone}\n\n"
                 f"{format_checklist(register_info.checklist)}\n\n"
                 f"Remarks: {register_info.remarks}",
        # Google Tasks 需要 ISO 8601 格式的 UTC 时间：2025-02-23T12:00:00.000Z
        # 只保留日期部分,去掉时间信息
        "due": due_string,
    }


def format_checklist(checklist):
    """格式化检查清单为编号列表"""
    if not checklist:
        return "无检查项"

    # 如果 checklist 是字符串（比如来自数据库或表单）
    if isinstance(checklist, str):
        try:
            checklist = json.loads(checklist)
        except json.JSONDecodeError:
            return "❌ 无法解析检查项"

    formatted_items = [f"{i + 1}. {item}" for i, item in enumerate(checklist)]
    return "CheckList:\n" + "\n".join(formatted_items)
