import json
import unittest
from datetime import datetime
from random import randint

from backend.app import create_app, db
from backend.app.models.register import RegisterInfo


class SubmitEndpointTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """ 初始化 Flask 应用 """
        cls.app = create_app()
        cls.app.config['TESTING'] = True  # 启用测试模式
        cls.client = cls.app.test_client()

    @classmethod
    def tearDownClass(cls):
        pass

    def test_submit_success(self):
        """ 测试 /submit 是否成功 """
        data = {
            "publisher_id": randint(1, 100),
            "property_add": "123 Main St",
            "appointment_date": "2025-02-25 10:00:00", #使用datetime格式
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "123-456-7890",
            "notice": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        # 发送 POST 请求
        response = self.client.post('/inspect/submit', data=json.dumps(data), content_type='application/json')

        # 断言返回 200 OK
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.decode(), 'OK')

        # 验证数据是否写入数据库
        with self.app.app_context():
            record = RegisterInfo.query.filter_by(email="john.doe@example.com").first()
            self.assertIsNotNone(record)
            self.assertEqual(record.name, "John Doe")

            #print record
            print(record)

    def test_list_all_register_info(self):
        with self.app.app_context():
            records = RegisterInfo.query.all()
            for record in records:
                print(record)


    def test_submit_missing_fields(self):
        """ 测试 /submit 如果缺少必填字段，是否正确处理 """
        data = {
            "publisher_id": datetime.now().strftime("%Y%m%d%H%M%S"),
            "property_add": "123 Main St",
            "appointment_date": "2025-02-23T10:00:00.000Z",
            "name": "John Doe",
            # "email" 缺失
            "phone": "123-456-7890",
            "notice": "Test Notice"
        }

        response = self.client.post('/submit', data=json.dumps(data), content_type='application/json')

        # 断言返回 400 Bad Request
        self.assertEqual(response.status_code, 400)

    def test_submit_database_error(self):
        """ 模拟数据库错误（例如唯一性约束）"""
        with self.app.app_context():
            db.session.close()  # 强制关闭数据库，制造错误

        data = {
            "publisher_id": 1,
            "property_add": "123 Main St",
            "appointment_date": "2025-02-23T10:00:00.000Z",
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "123-456-7890",
            "notice": "Test Notice"
        }

        response = self.client.post('/submit', data=json.dumps(data), content_type='application/json')

        # 断言返回 500 错误
        self.assertEqual(response.status_code, 500)


if __name__ == '__main__':
    unittest.main()
