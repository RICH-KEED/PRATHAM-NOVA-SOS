
import requests
import subprocess
import os
from dotenv import load_dotenv
from flask_cors import CORS
from flask import Flask, jsonify, request

app = Flask(__name__)

load_dotenv()
CORS(app)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")


def send_telegram_message(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": message}
    response = requests.post(url, json=payload)
    return response.status_code == 200

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route("/report", methods=["GET"])
def report_emergency():  
    try:
        name = request.args.get("name")
        subject = request.args.get("subject")
        description = request.args.get("description", "")
        lat = request.args.get("lat", "N/A")
        lng = request.args.get("lng", "N/A")
        

        message = f"🚨 Emergency Report 🚨\nName: {name}\nIncident: {subject}\nLocation: {lat}, {lng}"
        if description:
            message += f"\nDetails: {description}"
        
        if not send_telegram_message(message):
            return jsonify({"detail": "Failed to send Telegram message"}), 500
        

        call_message = f"{subject} incident reported by {name} at coordinates {lat}, {lng}."
        if description:
            call_message += f" Additional details: {description}"
        

        subprocess.run(["python", "call.py", subject, call_message])
        
        return jsonify({"message": "Emergency reported successfully"})
    except Exception as e:
        return jsonify({"detail": str(e)}), 500

    
if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
