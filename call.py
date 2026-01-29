import os
import sys
import requests
from twilio.rest import Client
from dotenv import load_dotenv

# sys.stdout.reconfigure(encoding='utf-8')  # Removed for Vercel compatibility


load_dotenv()

GROQ_API_KEY1 = os.getenv("GROQ_API_KEY1")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")


CONTACTS = {
    "Theft": "+918115067311",
    "Accident": "+918115067311",
    "Fire": "+918115067311",
}

def generate_message(prompt):
    """Generate message using Groq API"""
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY1}"},
            json={
                "model": "llama-3.2-3b-preview",
                "messages": [
                    {"role": "system", "content": "You are an AI assistant responsible for generating concise and clear emergency reports for Twilio voice calls. Your task is to format an emergency alert message including the incident type, location coordinates, and timestamp. Ensure the message is urgent yet easy to understand. Example: 'Emergency Alert: A fire has been reported at [latitude], [longitude] on [date and time]. Please dispatch emergency services immediately.' Adjust the format based on the incident type while maintaining clarity and brevity. Include any additional details provided about the incident."},
                    {"role": "user", "content": prompt}
                ]
            },
            timeout=10
        )
        return response.json()['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f"Error generating message: {e}")
        return None


def make_call(number, message):
    """Initiate Twilio call with message"""
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    try:
        call = client.calls.create(
            twiml=f'''
            <Response>
                <Say>{message}</Say>
                <Hangup/>
            </Response>
            ''',
            to=number,
            from_=TWILIO_PHONE_NUMBER
        )
        return call.sid
    except Exception as e:
        print(f"Call failed: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python finalcall.py <contact_name> \"<message>\"")
        sys.exit(1)

    contact_arg = sys.argv[1]
    full_message = " ".join(sys.argv[2:])


    matching_name = None
    for name in CONTACTS:
        if name.lower() == contact_arg.lower():
            matching_name = name
            break

    if not matching_name:
        print(f"Error: Contact '{contact_arg}' not found.")
        sys.exit(1)

    print("Generating message...")
    message = generate_message(full_message)
    
    if not message:
        print("Error: Failed to generate message")
        sys.exit(1)


    print(f"📞 Calling {matching_name}...")
    call_sid = make_call(CONTACTS[matching_name], message)
    
    if call_sid:
        print(f"✅ Call initiated! SID: {call_sid}")
        sys.exit(0)
    else:
        print("❌ Failed to initiate call")
        sys.exit(1)
