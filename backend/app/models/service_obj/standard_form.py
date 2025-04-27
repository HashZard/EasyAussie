from enum import Enum
from backend.app.models import db
from backend.app.models.basemodel import BaseModel


class FormType(Enum):
    INSPECTION = "inspection"
    COVERLETTER = "coverletter"
    RENTAL_APPLICATION = "rentalApplication"
    AIRPORT_PICKUP = "airportPickup"
    Test = "test"

    @classmethod
    def values(cls):
        """返回所有合法的字符串值"""
        return [member.value for member in cls]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """检查是否为合法值（字符串）"""
        return value in cls._value2member_map_

    @classmethod
    def from_str(cls, value: str):
        """从字符串获取对应枚举对象，如果非法则抛出异常"""
        try:
            return cls(value)
        except ValueError:
            raise ValueError(f"Invalid form type: {value}")


class StandardForm(BaseModel):
    __tablename__ = "standard_form"

    email = db.Column(db.String(120), nullable=False)
    form_type = db.Column(db.String(50), nullable=False)  # student / worker
    form_data = db.Column(db.Text, nullable=False)  # JSON string
    files = db.Column(db.Text, nullable=True)  # JSON mapping of file keys to paths
    remark = db.Column(db.String(255), nullable=True)  # 可选备注

    def __init__(self, email, form_type, form_data, files=None, remark=None):
        self.email = email
        self.form_type = form_type
        self.form_data = form_data
        self.files = files
        self.remark = remark
