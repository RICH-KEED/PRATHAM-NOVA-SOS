
import requests
import subprocess
import os
from dotenv import load_dotenv
from flask_cors import CORS
from flask import Flask, jsonify, request ,send_from_directory

from call import generate_message, make_call, CONTACTS

app = Flask(__name__)

load_dotenv()
CORS(app)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# Environment Variable Check
REQUIRED_VARS = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "GROQ_API_KEY1", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]
missing_vars = [var for var in REQUIRED_VARS if not os.getenv(var)]
if missing_vars:
    print(f"CRITICAL: Missing environment variables: {', '.join(missing_vars)}")

def send_telegram_message(message):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("Telegram configuration missing")
        return False
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": message}
    try:
        response = requests.post(url, json=payload, timeout=5)
        return response.status_code == 200
    except Exception as e:
        print(f"Error sending Telegram message: {e}")
        return False

@app.route('/')
def serve_index():
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), 'index.html')

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
            print("Failed to send Telegram message")
        

        call_message = f"{subject} incident reported by {name} at coordinates {lat}, {lng}."
        if description:
            call_message += f" Additional details: {description}"
        
        # Directly call functions instead of subprocess
        matching_name = None
        for k in CONTACTS:
            if k.lower() == subject.lower():
                matching_name = k
                break
        
        if matching_name:
            prompt = f"{subject} emergency. {call_message}"
            voice_message = generate_message(prompt)
            if voice_message:
                make_call(CONTACTS[matching_name], voice_message)
        
        return jsonify({"message": "Emergency reported successfully"})
    except Exception as e:
        return jsonify({"detail": str(e)}), 500

    
if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
