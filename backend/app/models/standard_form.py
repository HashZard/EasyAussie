from sqlalchemy import Column, String, Text

from backend.app.models.basemodel import BaseModel


class StandardForm(BaseModel):
    __tablename__ = "standard_form"

    email = Column(String(120), nullable=False)
    form_type = Column(String(50), nullable=False)  # student / worker
    form_data = Column(Text, nullable=False)        # JSON string
    files = Column(Text, nullable=True)             # JSON mapping of file keys to paths
    remark = Column(String(255), nullable=True)     # 可选备注

    def __init__(self, email, form_type, form_data, files=None, remark=None):
        self.email = email
        self.form_type = form_type
        self.form_data = form_data
        self.files = files
        self.remark = remark
