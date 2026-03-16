import math

class RiskManager:
    def __init__(self, capital: float = 70000, margin: int = 5, max_loss: float = 10000, max_trades: int = 50):
        self.capital = capital
        self.margin = margin
        self.max_loss = max_loss
        self.max_trades = max_trades
        
        self.current_trades_count = 0
        self.cumulative_pnl = 0.0
        self.is_trading_enabled = True

    def calculate_quantity(self, current_price: float) -> int:
        exposure = self.capital * self.margin
        quantity = math.floor(exposure / current_price)
        return quantity

    def can_trade(self) -> bool:
        if not self.is_trading_enabled:
            return False
        if self.current_trades_count >= self.max_trades:
            return False
        if self.cumulative_pnl <= -self.max_loss:
            return False
        return True

    def update_pnl(self, pnl: float):
        self.cumulative_pnl += pnl
        if self.cumulative_pnl <= -self.max_loss:
            self.is_trading_enabled = False
            print(f"CRITICAL: Daily loss limit hit! PnL: {self.cumulative_pnl}")

    def increment_trade_count(self):
        self.current_trades_count += 1
        if self.current_trades_count >= self.max_trades:
            print(f"INFO: Max trades reached for the day: {self.current_trades_count}")

    def reset_daily(self):
        self.current_trades_count = 0
        self.cumulative_pnl = 0.0
        self.is_trading_enabled = True
