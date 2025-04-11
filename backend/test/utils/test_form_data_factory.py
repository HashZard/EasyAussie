from datetime import datetime
from copy import deepcopy


class TestFormDataFactory:
    DEFAULT_DATA = {
        "formType": "inspection",
        "name": "Test User",
        "email": "test@example.com",
        "phone": "+61400000000",
        "address": "Unit 101",
        "appointmentDate": datetime.now().strftime("%Y-%m-%dT%H:%M"),
        "checklist[]": ["1", "2"],
        "remark": "This is a test remark"
    }

    @classmethod
    def build(cls, overrides=None, exclude=None):
        """
        构建一个完整的可提交表单数据对象，支持字段替换和排除
        :param overrides: dict 类型，用于修改默认字段值
        :param exclude: list 类型，用于排除字段
        :return: dict，模拟的 form-data 提交数据
        """
        data = deepcopy(cls.DEFAULT_DATA)

        if overrides:
            data.update(overrides)

        if exclude:
            for key in exclude:
                data.pop(key, None)

        return data

    @classmethod
    def build_missing_email(cls):
        return cls.build(exclude=["email"])

    @classmethod
    def build_invalid_phone(cls):
        return cls.build(overrides={"phone": "invalid"})

    @classmethod
    def build_with_file(cls, file_obj):
        """模拟包含上传文件的情况"""
        data = cls.build()
        data["file"] = file_obj  # 例如: ("filename.txt", BytesIO(b"content"))
        return data
