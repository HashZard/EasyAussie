import logging
from datetime import datetime, timezone

from flask import jsonify

from backend.app.clients.api_google_task import create_google_task
from backend.app.models.service_obj.transfer_obj import AirportPickupInfo

app_logger = logging.getLogger('app_logger')


def handle(req):
    data = req.form.to_dict()

    pickup_info = AirportPickupInfo(data=data)
    pickup_info.save()

    create_google_task(create_task_body(pickup_info))

    return jsonify({"success": True, "message": "Task created successfully"}), 200


def reload_record():
    """
    get the latest data from the database based on the email in the Cookie.

    Returns:
        - success: return the latest data from database in JSON format.
        - error: return error message in JSON format.
    """
    pass

def create_task_body(pickup_info: AirportPickupInfo):
    """
    构造 airport pickup 类型的 Google Task 任务体
    :param pickup_info: AirportPickupInfo 实例
    :return: dict，用于 Google Task API 的 body 参数
    """
    if not isinstance(pickup_info.pickup_time, datetime):
        raise ValueError("pickup_time must be a datetime object")

    due_string = (
        pickup_info.pickup_time.astimezone(timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )

    return {
        "title": f"(待确认) {pickup_info.flight_number}",
        "notes": f"Time: {pickup_info.pickup_time}\n"
                 f"Name: {pickup_info.wx_name}\n"
                 f"Phone: {pickup_info.contact_phone}\n"
                 f"Flight: {pickup_info.flight_number}\n"
                 f"Destination: {pickup_info.destination}\n"
                 f"Luggage: {pickup_info.luggage_info or '-'}\n"
                 f"Note: {pickup_info.note or '-'}",
        "due": due_string,
    }
