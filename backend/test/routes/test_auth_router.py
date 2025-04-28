import unittest
import random
import string
from backend.app import create_app


class UserBatchRegisterTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()
        cls.password = "Test@1234"
        cls.user_count = 3

    def generate_random_email(self):
        prefix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        return f"{prefix}@example.com"

    def fetch_captcha_code(self):
        """模拟前端拿验证码"""
        response = self.client.get("/api/captcha")
        with self.client.session_transaction() as sess:
            captcha_code = sess.get('captcha_code')
        self.assertIsNotNone(captcha_code, "获取验证码失败")
        return captcha_code

    def test_batch_register_users(self):
        success_count = 0

        for _ in range(self.user_count):
            email = self.generate_random_email()
            captcha_code = self.fetch_captcha_code()

            payload = {
                "email": email,
                "password": self.password,
                "code": captcha_code
            }

            response = self.client.post("/api/register", json=payload)

            # 校验
            self.assertEqual(response.status_code, 200, f"注册失败，状态码: {response.status_code}")
            self.assertTrue(response.json.get("success"), f"注册失败，返回: {response.json}")

            print(f"✅ 成功注册: {email}")

            # 保存注册的用户信息到CSV,有表头:Email,Password
            with open("registered_users.csv", "a") as f:
                if f.tell() == 0:
                    f.write("Email,Password\n")
                f.write(f"{email},{self.password}\n")

            success_count += 1

        print(f"\n✅ 成功注册 {success_count} 个用户")


if __name__ == '__main__':
    unittest.main()
