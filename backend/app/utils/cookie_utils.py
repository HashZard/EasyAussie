from flask import request


def get_email_from_cookie():
    """
    从请求的Cookie中获取邮箱。

    Returns:
        str: 返回邮箱地址，如果Cookie中不存在则返回None。
    """
    return request.cookies.get('email')
