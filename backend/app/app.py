from backend.app import create_app

# 创建 Flask 应用
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
