import unittest
from io import BytesIO

from backend.app import create_app
from backend.test.utils.test_form_data_factory import TestFormDataFactory


class UnifiedFormSubmitTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()

    def test_generic_form_submit_success(self):
        """测试统一表单提交接口是否正常接受请求"""
        data = TestFormDataFactory.build(overrides={
            "formType": "test"
        })

        response = self.client.post(
            "/api/form-submit",
            data=data,
            content_type="multipart/form-data"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['status'], 'success')

    def test_form_submit_with_file_upload(self):
        """测试包含文件上传的表单提交"""
        data = TestFormDataFactory.build(overrides={
            "formType": "test",
            "description": "测试带文件上传"
        })

        # 添加模拟上传文件
        data["file"] = (BytesIO(b"fake file content"), "test.txt")

        response = self.client.post(
            "/api/form-submit",
            data=data,
            content_type="multipart/form-data"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['status'], 'success')


if __name__ == '__main__':
    unittest.main()
