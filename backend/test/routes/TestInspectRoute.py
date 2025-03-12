import json
import unittest
from unittest.mock import patch

from flask import jsonify

from backend.app import create_app
from backend.app.models.register import RegisterInfo
from backend.test.test_data import get_test_data_json


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
        test_data = get_test_data_json()
        print("Test data: ", test_data)

        # 发送 POST 请求
        response = self.client.post('/inspect/submit', data=test_data, content_type='application/json')

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


    def setUp(self):
        with self.app.app_context():
            # 可以在这里添加数据库的测试数据
            self.test_record = RegisterInfo(data=get_test_data_json())
            print("Test record: ", self.test_record)
            self.test_record.save()


    def test_get_latest_data_success(self):
        """测试通过 Cookie 提供的邮箱获取最新数据成功"""
        with patch("backend.app.routes.inspect.cookie_utils.get_email_from_cookie") as mock_get_email:
            mock_get_email.return_value = self.test_record.email

            # 模拟 GET 请求
            response = self.client.get('/api/inspect/latest')

            # 打印响应数据
            print("Response data: ", response.data)

            # 检查返回的状态码是否为 200
            self.assertEqual(response.status_code, 200)

            # 检查响应数据
            response_data = response.get_json()
            self.assertTrue(response_data["success"])
            self.assertEqual(response_data["data"]["name"], self.test_record.name)
            self.assertEqual(response_data["data"]["email"], self.test_record.email)

    def test_get_latest_data_no_cookie(self):
        """测试未提供 Cookie 情况"""
        with patch("backend.app.utils.cookie_utils.get_email_from_cookie") as mock_get_email:
            mock_get_email.return_value = None

            # 模拟 GET 请求
            response = self.client.get('/api/inspect/latest')

            # 检查返回的状态码是否为 400
            self.assertEqual(response.status_code, 400)

            # 验证错误信息
            response_data = response.get_json()
            self.assertIn("error", response_data)
            self.assertEqual(response_data["error"], "Cookie中未找到邮箱")

    def test_get_latest_data_not_found(self):
        """测试提供的邮箱未找到匹配的数据"""
        with patch("backend.app.utils.cookie_utils.get_email_from_cookie") as mock_get_email:
            mock_get_email.return_value = "not.existing@example.com"

            # 模拟 GET 请求
            response = self.client.get('/api/inspect/latest')

            # 检查返回的状态码是否为 404
            self.assertEqual(response.status_code, 404)

            # 验证错误信息
            response_data = response.get_json()
            self.assertIn("error", response_data)
            self.assertEqual(response_data["error"], "未找到数据")


if __name__ == '__main__':
    unittest.main()
