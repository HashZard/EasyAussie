from flask import Flask, request, jsonify
from google.oauth2 import service_account
from googleapiclient.discovery import build
import datetime

app = Flask(__name__)

# 配置 Google Sheets API
SERVICE_ACCOUNT_FILE = '/path/to/service-account.json'
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)
sheets_service = build('sheets', 'v4', credentials=credentials)

SPREADSHEET_ID = 'your-spreadsheet-id'
SHEET_NAME = 'Sheet1'

@app.route('/api/submit', methods=['POST'])
def submit():
    data = request.json
    print('收到的数据:', data)

    # 获取表单数据
    address = data.get('address')
    date = data.get('date')
    name = data.get('name')

    # 插入数据到 Google Sheets
    try:
        new_row = [datetime.datetime.now().isoformat(), address, date, name]

        sheets_service.spreadsheets().values().append(
            spreadsheetId=SPREADSHEET_ID,
            range=f'{SHEET_NAME}!A:D',
            valueInputOption='USER_ENTERED',
            insertDataOption='INSERT_ROWS',
            body={'values': [new_row]}
        ).execute()

        return jsonify({'status': 'success', 'message': '数据已保存到 Google Sheets'})
    except Exception as e:
        print('保存失败:', str(e))
        return jsonify({'status': 'error', 'message': '保存失败', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)

