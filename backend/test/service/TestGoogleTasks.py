# backend/tests/services/test_google_tasks.py
import unittest
from backend.app.services.google_tasks import create_google_task
from backend.app.models.register import RegisterInfo

class TestGoogleTasks(unittest.TestCase):
    def test_create_google_task_with_real_data(self):
        # 真实的 RegisterInfo 数据
        register_info = RegisterInfo(
            id=1,
            publisher_id=1,
            property_add="123 Main St",
            appointment_date="2025-02-25T10:00:00.000Z",
            name="John Doe",
            email="john.doe@example.com",
            phone="123-456-7890",
            notice="Test notice"
        )

        # 调用函数创建任务
        result = create_google_task(register_info)

        # 验证任务是否成功创建
        self.assertIsNotNone(result)
        self.assertIn('id', result)
        self.assertEqual(result['title'], "(代确认) 123 Main St")

if __name__ == '__main__':
    unittest.main()