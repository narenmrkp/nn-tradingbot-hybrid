import os
import time
import datetime
import threading
from typing import List
from .broker import Broker
from .strategy import TradingStrategy
from .risk import RiskManager
from .notifications import NotificationManager

class TradingEngine:
    def __init__(self, broker: Broker, risk_manager: RiskManager, notifier: NotificationManager, watchlist: List[str]):
        self.broker = broker
        self.risk = risk_manager
        self.notifier = notifier
        self.watchlist = watchlist
        
        self.is_running = False
        self.active_positions = {} # symbol -> {qty, entry_price, side}
        self.user_mobile = '+91 9490120326'
        
    def start(self):
        if self.is_running: return
        self.is_running = True
        self.engine_thread = threading.Thread(target=self._run_loop, daemon=True)
        self.engine_thread.start()
        print("Trading Engine Started")

    def stop(self):
        self.is_running = False
        print("Trading Engine Stopped")

    def _run_loop(self):
        while self.is_running:
            now = datetime.datetime.now()
            
            # 1. Check Time Window (09:15 AM to 03:10 PM)
            # BYPASSING FOR DEMO
            # if not (datetime.time(9, 15) <= now.time() <= datetime.time(15, 10)):
            #     if now.time() > datetime.time(15, 10):
            #         self._force_close_all()
            #     time.sleep(60)
            #     continue

            # 2. Risk Check
            if not self.risk.can_trade() and not self.active_positions:
                time.sleep(60)
                continue

            # 3. Main Scan
            print(f"Engine Heartbeat: Scanning {len(self.watchlist)} symbols...")
            for symbol in self.watchlist:
                try:
                    self._process_symbol(symbol)
                except Exception as e:
                    print(f"Error processing {symbol}: {e}")
            
            time.sleep(10) # Run every 10 seconds for demo (was 60)

    def _process_symbol(self, symbol: str):
        # Fetch OHLC
        df = self.broker.get_ohlc(symbol, interval='5min', limit=100)
        df = TradingStrategy.calculate_indicators(df)
        
        # Check if already in position
        if symbol in self.active_positions:
            # Check Exit
            pos = self.active_positions[symbol]
            if TradingStrategy.check_exit_signal(df, pos['entry_price']):
                self._exit_trade(symbol, pos)
        else:
            # Check Entry
            if self.risk.can_trade() and TradingStrategy.check_entry_signal(df):
                self._enter_trade(symbol, df.iloc[-1]['close'])

    def _enter_trade(self, symbol: str, price: float):
        qty = self.risk.calculate_quantity(price)
        if qty <= 0: return
        
        order_id = self.broker.place_order(symbol, qty, side='BUY', order_type='MIS')
        if order_id:
            self.active_positions[symbol] = {
                'qty': qty,
                'entry_price': price,
                'side': 'BUY',
                'timestamp': datetime.datetime.now()
            }
            self.risk.increment_trade_count()
            self.notifier.send_whatsapp(self.user_mobile, f"🚀 TRADE ENTERED: {symbol}\nQty: {qty}\nPrice: {price}")

    def _exit_trade(self, symbol: str, pos: dict):
        # Get current price
        df = self.broker.get_ohlc(symbol, interval='5min', limit=1)
        exit_price = df.iloc[-1]['close']
        
        success = self.broker.close_position(symbol)
        if success:
            pnl = (exit_price - pos['entry_price']) * pos['qty']
            self.risk.update_pnl(pnl)
            del self.active_positions[symbol]
            
            status = "PROFIT" if pnl > 0 else "LOSS"
            self.notifier.send_whatsapp(self.user_mobile, f"🏁 TRADE EXITED: {symbol}\nExit Price: {exit_price}\nPnL: {pnl:.2f} ({status})")

    def _force_close_all(self):
        if not self.active_positions: return
        print("Market closing. Force closing all positions.")
        for symbol in list(self.active_positions.keys()):
            self._exit_trade(symbol, self.active_positions[symbol])
        self.stop()
