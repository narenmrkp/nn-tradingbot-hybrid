import os
from twilio.rest import Client

class NotificationManager:
    def __init__(self, account_sid: str = None, auth_token: str = None, from_whatsapp: str = None):
        self.account_sid = account_sid or os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = auth_token or os.getenv('TWILIO_AUTH_TOKEN')
        self.from_whatsapp = from_whatsapp or os.getenv('TWILIO_WHATSAPP_NUMBER')
        
        if self.account_sid and self.auth_token and "xxx" not in self.account_sid.lower():
            try:
                self.client = Client(self.account_sid, self.auth_token)
            except Exception as e:
                self.client = None
                print(f"WARNING: Twilio initialization failed: {e}")
        else:
            self.client = None
            print("INFO: Twilio credentials are dummy or missing. WhatsApp notifications will be logged to console.")

    def send_whatsapp(self, to_number: str, message: str):
        if not self.client:
            print(f"MOCK WHATSAPP to {to_number}: {message}")
            return
            
        try:
            self.client.messages.create(
                body=message,
                from_=f'whatsapp:{self.from_whatsapp}',
                to=f'whatsapp:{to_number}'
            )
            print(f"WhatsApp sent to {to_number}")
        except Exception as e:
            print(f"Error sending WhatsApp: {e}")
