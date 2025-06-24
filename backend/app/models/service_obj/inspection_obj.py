from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.app.models.basemodel import BaseModel
import json


class RegisterInfo(BaseModel):
    __tablename__ = 'register_info'

    __field_map__ = {
        "publisher_id": Column(Integer, nullable=True),
        "property_add": Column(String(255), nullable=False),
        "appointment_date": Column(DateTime, nullable=True),
        "name": Column(String(128), nullable=True),
        "email": Column(String(128), nullable=True),
        "phone": Column(String(32), nullable=True),
        "checklist": Column(Text, nullable=True),
    }

    def __init__(self, data):
        super().__init__()
        self.publisher_id = data.get("publisher_id")
        self.property_add = data.get("property_add")
        self.name = data.get("name")
        self.email = data.get("email")
        self.phone = data.get("phone")

        checklist = data.get("checklist")
        if isinstance(checklist, list):
            self.checklist = json.dumps(checklist)
        elif isinstance(checklist, str):
            self.checklist = checklist
        else:
            self.checklist = "[]"

        date_str = data.get("appointmentDate")
        if date_str:
            try:
                self.appointment_date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M")
            except ValueError:
                self.appointment_date = None

    def __repr__(self):
        return f"<RegisterInfo {self.to_dict()}>"

    def to_dict(self):
        return {
            "id": self.id,
            "publisher_id": self.publisher_id,
            "property_add": self.property_add,
            "appointment_date": self.appointment_date.isoformat() if self.appointment_date else None,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "checklist": json.loads(self.checklist) if self.checklist else [],
            "created_gmt": self.created_gmt.isoformat() if self.created_gmt else None,
            "updated_gmt": self.updated_gmt.isoformat() if self.updated_gmt else None,
        }
