import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const GROQ_API_KEY1 = process.env.GROQ_API_KEY1;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const CONTACTS: Record<string, string> = {
  'Theft': process.env.THEFT_CONTACT || '+918115067311',
  'Accident': process.env.ACCIDENT_CONTACT || '+918115067311',
  'Fire': process.env.FIRE_CONTACT || '+918115067311',
};

async function sendTelegramMessage(message: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });
    return response.status === 200;
  } catch (error) {
    console.error('Telegram error:', error);
    return false;
  }
}

async function generateMessage(prompt: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.2-3b-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant responsible for generating concise and clear emergency reports for Twilio voice calls. Your task is to format an emergency alert message including the incident type, location coordinates, and timestamp. Ensure the message is urgent yet easy to understand.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Groq error:', error);
    return null;
  }
}

async function makeCall(number: string, message: string): Promise<string | null> {
  try {
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    const twiml = `<Response><Say>${message}</Say><Hangup/></Response>`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: number,
          From: TWILIO_PHONE_NUMBER || '',
          Twiml: twiml,
        }).toString(),
      }
    );

    const data = await response.json();
    return data.sid || null;
  } catch (error) {
    console.error('Twilio call error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const subject = searchParams.get('subject');
    const description = searchParams.get('description') || '';
    const lat = searchParams.get('lat') || 'N/A';
    const lng = searchParams.get('lng') || 'N/A';

    if (!name || !subject) {
      return NextResponse.json({ detail: 'Missing required fields' }, { status: 400 });
    }

    // Send Telegram message
    const telegramMessage = `🚨 Emergency Report 🚨\nName: ${name}\nIncident: ${subject}\nLocation: ${lat}, ${lng}${description ? `\nDetails: ${description}` : ''}`;
    
    const telegramSent = await sendTelegramMessage(telegramMessage);
    if (!telegramSent) {
      return NextResponse.json({ detail: 'Failed to send Telegram message' }, { status: 500 });
    }

    // Generate and make call
    const callMessage = `${subject} incident reported by ${name} at coordinates ${lat}, ${lng}.${description ? ` Additional details: ${description}` : ''}`;
    const generatedMessage = await generateMessage(callMessage);

    if (generatedMessage) {
      const contactNumber = CONTACTS[subject] || CONTACTS['Accident'];
      await makeCall(contactNumber, generatedMessage);
    }

    return NextResponse.json({ message: 'Emergency reported successfully' });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ detail: String(error) }, { status: 500 });
  }
}
