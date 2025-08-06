#!/usr/bin/env python3
"""
简单的认证API测试脚本
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_auth_apis():
    """测试认证相关API"""
    
    print("=== 认证API测试 ===")
    
    # 测试获取验证码
    print("\n1. 测试获取验证码...")
    try:
        response = requests.get(f"{BASE_URL}/captcha")
        if response.status_code == 200:
            print("✓ 验证码获取成功")
        else:
            print(f"✗ 验证码获取失败: {response.status_code}")
    except Exception as e:
        print(f"✗ 验证码获取异常: {e}")
    
    # 测试获取个人信息（需要登录）
    print("\n2. 测试获取个人信息（未登录）...")
    try:
        response = requests.get(f"{BASE_URL}/profile")
        if response.status_code == 401:
            print("✓ 未登录状态正确返回401")
        else:
            print(f"✗ 未登录状态返回: {response.status_code}")
    except Exception as e:
        print(f"✗ 个人信息获取异常: {e}")
    
    # 测试更新个人信息（需要登录）
    print("\n3. 测试更新个人信息（未登录）...")
    try:
        data = {
            "name": "测试用户",
            "phone": "13800138000"
        }
        response = requests.put(f"{BASE_URL}/profile", json=data)
        if response.status_code == 401:
            print("✓ 未登录状态正确返回401")
        else:
            print(f"✗ 未登录状态返回: {response.status_code}")
    except Exception as e:
        print(f"✗ 个人信息更新异常: {e}")
    
    # 测试修改密码（需要登录）
    print("\n4. 测试修改密码（未登录）...")
    try:
        data = {
            "currentPassword": "oldpass",
            "newPassword": "newpass"
        }
        response = requests.post(f"{BASE_URL}/change-password", json=data)
        if response.status_code == 401:
            print("✓ 未登录状态正确返回401")
        else:
            print(f"✗ 未登录状态返回: {response.status_code}")
    except Exception as e:
        print(f"✗ 密码修改异常: {e}")
    
    print("\n=== 测试完成 ===")
    print("提示: 需要先启动后端服务器才能完整测试")

if __name__ == "__main__":
    test_auth_apis()
