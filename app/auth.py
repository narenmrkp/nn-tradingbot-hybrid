import pyotp
import time

class OTPManager:
    def __init__(self, secret: str = None):
        # In production, this secret should be unique per user and stored securely
        self.secret = secret or pyotp.random_base32()
        self.totp = pyotp.TOTP(self.secret, interval=300) # 5 minute expiry
        self.is_authenticated = False
        self.last_auth_time = 0

    def generate_otp(self) -> str:
        return self.totp.now()

    def verify_otp(self, otp: str) -> bool:
        if self.totp.verify(otp):
            self.is_authenticated = True
            self.last_auth_time = time.time()
            return True
        return False

    def check_auth_status(self) -> bool:
        # Check if authenticated within the last 24 hours (daily reset)
        if not self.is_authenticated:
            return False
        
        # Reset auth if it's a new day (simple check)
        current_time = time.time()
        if current_time - self.last_auth_time > 86400:
            self.is_authenticated = False
            return False
            
        return True

    def logout(self):
        self.is_authenticated = False
