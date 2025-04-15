from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime

from backend.app.models.basemodel import BaseModel


class AirportPickupInfo(BaseModel):
    __tablename__ = 'airport_pickup_info'

    __field_map__ = {
        "wx_name": Column(String(100), nullable=False),
        "flight_number": Column(String(50), nullable=False),
        "pickup_time": Column(DateTime, nullable=False),
        "contact_phone": Column(String(32), nullable=False),
        "destination": Column(String(255), nullable=False),
        "luggage_info": Column(Text, nullable=True),
        "note": Column(Text, nullable=True),
    }

    def __init__(self, data):
        super().__init__()
        self.wx_name = data.get("wx_name")
        self.flight_number = data.get("flight_number")
        self.contact_phone = data.get("contact_phone")
        self.destination = data.get("destination")
        self.luggage_info = data.get("luggage_info")
        self.note = data.get("note")

        pickup_time_str = data.get("pickup_time")
        if pickup_time_str:
            try:
                self.pickup_time = datetime.strptime(pickup_time_str, "%Y-%m-%dT%H:%M")
            except ValueError:
                self.pickup_time = None

    def __repr__(self):
        return f"<AirportPickupInfo {self.to_dict()}>"

    def to_dict(self):
        return {
            "id": self.id,
            "wx_name": self.wx_name,
            "flight_number": self.flight_number,
            "pickup_time": self.pickup_time.isoformat() if self.pickup_time else None,
            "contact_phone": self.contact_phone,
            "destination": self.destination,
            "luggage_info": self.luggage_info,
            "note": self.note,
            "created_gmt": self.created_gmt.isoformat() if self.created_gmt else None,
            "updated_gmt": self.updated_gmt.isoformat() if self.updated_gmt else None,
        }
