import os
from fastapi import FastAPI, Request, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from .broker import FyersBroker
from .risk import RiskManager
from .notifications import NotificationManager
from .engine import TradingEngine
from .auth import OTPManager

app = FastAPI()

# Enable CORS for dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Components
USER_MOBILE = '+91 9490120326'

broker = FyersBroker(
    api_key=os.getenv('FYERS_API_KEY') or "DUMMY_FYERS_KEY",
    secret_key=os.getenv('FYERS_SECRET_KEY'),
    redirect_uri=os.getenv('FYERS_REDIRECT_URI'),
    totp_secret=os.getenv('FYERS_TOTP_SECRET')
)
risk = RiskManager()
notifier = NotificationManager()
otp_manager = OTPManager(secret=os.getenv('TOTP_SECRET'))
watchlist = ["DIXON", "KAYNES", "APARINDS", "LTTS", "ABB", "EICHERMOT", "MCX", "BSE", "NETWEB", "BAJAJAUTO"]

engine = TradingEngine(broker, risk, notifier, watchlist)

# AUTO-START FOR DEMO
engine.start()

@app.get("/")
async def root():
    return {"message": "FastAPI is running"}

@app.get("/api/status")
async def get_status(broker: str = "Fyers", mode: str = "paper"):
    # Simulate different data for different brokers/modes for demo purposes
    pnl = risk.cumulative_pnl
    trades = risk.current_trades_count
    positions = engine.active_positions
    
    if broker == "Zerodha":
        pnl = pnl * 1.2 + 500
        trades = trades + 1
    elif broker == "FlatTrade":
        pnl = pnl * 0.8 - 200
        trades = max(0, trades - 1)
        
    if mode == "real":
        # In real mode, maybe show slightly different stats or a warning
        pass

    return {
        "is_running": engine.is_running,
        "is_authenticated": True,
        "pnl": pnl,
        "trades_count": trades,
        "active_positions": positions,
        "user_mobile": USER_MOBILE,
        "is_simulation": mode == "paper"
    }

@app.post("/api/whatsapp/webhook")
async def whatsapp_webhook(Body: str = Form(...), From: str = Form(...)):
    user_msg = Body.strip().upper()
    sender = From.replace("whatsapp:", "")
    
    print(f"Received WhatsApp message from {sender}: {user_msg}")
    
    # Auth Logic
    if not otp_manager.check_auth_status():
        if user_msg == "START BOT":
            otp = otp_manager.generate_otp()
            msg = f"🔐 OTP for Trading: {otp}\nExpires in 5 minutes."
            print(f"CONSOLE LOG (OTP): {msg}") # Always log to console for dummy mode
            notifier.send_whatsapp(sender, msg)
            return {"status": "otp_sent"}
        
        if user_msg.isdigit() and len(user_msg) == 6:
            if otp_manager.verify_otp(user_msg):
                notifier.send_whatsapp(sender, "✅ Authentication Successful. Trading Enabled.")
                engine.start()
                return {"status": "authenticated"}
            else:
                notifier.send_whatsapp(sender, "❌ Invalid OTP. Try again.")
                return {"status": "invalid_otp"}
        
        notifier.send_whatsapp(sender, "⚠️ Bot is locked. Send 'START BOT' to begin.")
        return {"status": "locked"}

    # Command Logic
    if user_msg == "STOP BOT":
        engine.stop()
        otp_manager.logout()
        notifier.send_whatsapp(sender, "🛑 Bot Stopped and Logged Out.")
    elif user_msg == "STATUS":
        msg = f"📊 STATUS:\nRunning: {engine.is_running}\nPnL: ₹{risk.cumulative_pnl:.2f}\nTrades: {risk.current_trades_count}/2"
        notifier.send_whatsapp(sender, msg)
    elif user_msg == "POSITIONS":
        if not engine.active_positions:
            notifier.send_whatsapp(sender, "📭 No active positions.")
        else:
            pos_msg = "📂 ACTIVE POSITIONS:\n"
            for s, p in engine.active_positions.items():
                pos_msg += f"- {s}: {p['qty']} @ ₹{p['entry_price']}\n"
            notifier.send_whatsapp(sender, pos_msg)
    elif user_msg == "P/L":
        msg = f"💰 Current P/L: ₹{risk.cumulative_pnl:.2f}"
        notifier.send_whatsapp(sender, msg)
    
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
