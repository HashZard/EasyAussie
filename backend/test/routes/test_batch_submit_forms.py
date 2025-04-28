import csv
import unittest
from io import BytesIO
from unittest.mock import patch

from backend.app import create_app


class FormSubmissionTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()
        cls.users = cls.load_users("registered_users.csv")  # 读取已注册的用户
        cls.files_fake = (BytesIO(b"fake file content"), "test.pdf")

    @staticmethod
    def load_users(csv_file):
        users = []
        with open(csv_file, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                users.append(row['Email'])
        return users

    def build_airport_pickup_form(self, email):
        return {
            "formType": "airportPickup",
            "email": email,
            "wx_name": "TestWX",
            "flight_number": "CA1234",
            "pickup_time": "2024-12-01T10:00",
            "contact_phone": "0400123456",
            "destination": "123 Main St, Perth WA",
            "luggage_info": "28寸箱子x2",
            "note": "测试数据"
        }

    def fake_file(self, filename="test.pdf"):
        """每次生成新的 BytesIO 对象"""
        return (BytesIO(b"fake file content"), filename)

    def build_rental_application_form(self, email):
        return {
            "formType": "rentalApplication",
            "email": email,
            "name": "Test User",
            "uniName": "Test University",
            "major": "Computer Science",
            "phone": "0400123456",
            "move_in": "2024-12-01",
            "remark": "测试数据",
            # 文件字段，每次新的BytesIO
            "passport": self.fake_file(),
            "visa": self.fake_file(),
            "balance_proof[]": self.fake_file(),
            "bank_statement[]": self.fake_file(),
            "student_id": self.fake_file(),
            "coe": self.fake_file(),
            "utility_bill": self.fake_file(),
            "guarantee_letter": self.fake_file()
        }

    def build_cover_letter_form(self, email):
        return {
            "formType": "coverletter",
            "email": email,
            "fullName": "Test User",
            "visaType": "Student",
            "arrivalDate": "2024-01",
            "stayUntil": "2026-01",
            "personalStrength": "Test Experience",
            "remark": "测试数据"
        }

    def build_inspection_form(self, email):
        return {
            "formType": "inspection",
            "email": email,
            "address": "35 Stirling Hwy, Crawley WA 6009",
            "appointment_date": "2024-12-01T12:00",
            "name": "Test User",
            "phone": "0400123456",
            "checklist[]": "检查水电"
        }

    def submit_form(self, form_data):
        """修正版：统一将普通字段和文件字段放到data里，Flask自己识别"""
        data = {}
        for key, value in form_data.items():
            if isinstance(value, tuple):
                data[key] = value  # 文件：(BytesIO对象, 文件名)
            else:
                data[key] = value  # 普通字段
        response = self.client.post(
            "/api/form-submit",
            data=data,
            content_type="multipart/form-data"
        )
        return response

    @patch('backend.app.services.transfer_handler.create_google_task')
    @patch('backend.app.services.inspection_handler.create_google_task')
    def test_batch_submit_forms(self, mock_transfer_create_task, mock_inspection_create_task):
        mock_transfer_create_task.return_value = None
        mock_inspection_create_task.return_value = None  # 不做任何事情

        total_submitted = 0

        for email in self.users:
            for builder in [
                self.build_airport_pickup_form,
                self.build_rental_application_form,
                self.build_cover_letter_form,
                self.build_inspection_form,
            ]:
                form_data = builder(email)
                response = self.submit_form(form_data)
                self.assertEqual(response.status_code, 200, f"提交失败，状态码: {response.status_code}")
                self.assertEqual(response.json.get("status"), "success", f"提交失败，返回: {response.json}")
                total_submitted += 1
                print(f"✅ 成功提交表单: {form_data['formType']} for {email}")

        print(f"\n✅ 全部完成，共提交 {total_submitted} 份表单！")


if __name__ == '__main__':
    unittest.main()
