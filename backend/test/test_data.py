from datetime import datetime, timedelta
import random
from faker import Faker

# 初始化 Faker
faker = Faker()


def get_test_data():
    return {
        # "publisher_id": random.randint(1, 100),  # 随机生成发布者 ID
        "property_add": faker.address(),  # 随机生成地址
        "appointment_date": datetime.now().strftime("%Y-%m-%dT%H:%M"),  # 当天日期和时间
        "name": faker.name(),  # 随机生成名字
        "email": faker.email(),  # 随机生成邮箱
        "phone": faker.phone_number(),  # 随机生成手机号
        "checklist": generate_checklist_items()  # 生成随机条数的检查事项
    }


def get_test_data_json():
    return {
        "publisher_id": random.randint(1, 100),
        "property_add": faker.address(),
        "appointment_date": datetime.now().strftime("%Y-%m-%dT%H:%M"),
        "name": faker.name(),
        "email": faker.email(),
        "phone": faker.phone_number(),
        "checklist": generate_checklist_items()
    }


def generate_checklist_items():
    """
    生成 1 到 5 条随机 "重点检查事项"。
    """
    checklist_count = random.randint(1, 5)  # 随机条数 (1~5)
    return [faker.sentence(nb_words=5) for _ in range(checklist_count)]  # 每条随机 5 个单词

if __name__ == '__main__':
    print(get_test_data())
    print(get_test_data_json())
