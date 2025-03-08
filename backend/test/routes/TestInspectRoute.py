import json
import unittest

from backend.app import create_app
from backend.app.models.register import RegisterInfo
from backend.test.test_data import get_test_data, get_test_data_json


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
        response = self.client.post('/inspect/submit', data=json.dumps(test_data), content_type='application/json')

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


if __name__ == '__main__':
    unittest.main()
