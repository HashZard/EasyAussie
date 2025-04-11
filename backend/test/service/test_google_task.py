import unittest
from werkzeug.test import EnvironBuilder
from werkzeug.wrappers import Request

from backend.app import create_app
from backend.app.services import inspection_handler
from backend.test.utils.test_form_data_factory import TestFormDataFactory


class GoogleTaskTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()

    def build_request(self, data_dict):
        builder = EnvironBuilder(
            method='POST',
            data=data_dict,
            content_type='multipart/form-data'
        )
        env = builder.get_environ()
        return Request(env)

    def test_inspection_handle_success(self):
        """测试 inspection 表单的正常提交流程"""
        form_data = TestFormDataFactory.build(overrides={"form_type": "inspection"})
        req = self.build_request(form_data)

        with self.app.app_context():
            result = inspection_handler.handle(req)

        # 根据你的 handler 返回类型修改断言
        # 假设返回字符串
        response, status_code = result

        self.assertEqual(status_code, 200)

        json_data = response.get_json()
        self.assertTrue(json_data.get("success"))

        # 如果返回是 Flask Response：
        # self.assertEqual(result.status_code, 200)
        # self.assertTrue(result.get_json()["success"])


if __name__ == '__main__':
    unittest.main()
