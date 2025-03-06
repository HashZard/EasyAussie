# test_data.py

from datetime import datetime

def get_test_data():
    return {
        "publisher_id": 1,
        "property_add": "123 Main St",
        "appointment_date": "2025-03-03T20:10",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "123-456-7890",
        "notice": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }