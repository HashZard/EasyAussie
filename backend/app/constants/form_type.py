from enum import Enum
from enum import Enum

class FormType(Enum):
    INSPECTION = "inspection"
    COVERLETTER = "coverletter"
    RENTAL_APPLICATION = "rentalApplication"
    AIRPORT_PICKUP = "airportPickup"

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
