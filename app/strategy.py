import pandas as pd
import pandas_ta as ta

class TradingStrategy:
    @staticmethod
    def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
        # EMA 9 and 20
        df['ema9'] = ta.ema(df['close'], length=9)
        df['ema20'] = ta.ema(df['close'], length=20)
        
        # Supertrend (10, 3)
        st = ta.supertrend(df['high'], df['low'], df['close'], length=10, multiplier=3)
        df['st_direction'] = st['SUPERTd_10_3.0']
        df['st_value'] = st['SUPERT_10_3.0']
        
        # Volume Average (20)
        df['vol_avg'] = ta.sma(df['volume'], length=20)
        
        return df

    @staticmethod
    def check_entry_signal(df: pd.DataFrame) -> bool:
        if len(df) < 10: return False # Reduced from 21
        
        last_row = df.iloc[-1]
        
        # EXTREMELY AGGRESSIVE FOR DEMO
        # Just check if close is above EMA9
        return last_row['close'] > last_row['ema9']

    @staticmethod
    def check_exit_signal(df: pd.DataFrame, entry_price: float) -> bool:
        if len(df) < 2: return False
        
        last_row = df.iloc[-1]
        
        # Exit conditions:
        # 1. EMA9 crosses below EMA20
        cond1 = last_row['ema9'] < last_row['ema20']
        
        # 2. Price falls below Supertrend
        cond2 = last_row['close'] < last_row['st_value']
        
        return cond1 or cond2
