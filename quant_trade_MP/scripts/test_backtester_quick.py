from app.services.backtester import Backtester
import pandas as pd

# Create sample price data
dates = pd.date_range(start='2023-01-01', periods=10, freq='D')

a = pd.DataFrame({'close': [150 + i for i in range(10)]}, index=dates)
b = pd.DataFrame({'close': [300 + i*2 for i in range(10)]}, index=dates)

price_data = {'AAPL': a, 'MSFT': b}

bt = Backtester()

weights = {'AAPL': 0.5, 'MSFT': 0.5}

try:
    eq, trades = bt.simulate(weights, price_data, initial_cash=100000)
    print('Equity rows:', len(eq))
    print(eq.head().to_dict())
    print('Trades rows:', len(trades))
    if not trades.empty:
        print(trades.head().to_dict())
    else:
        print('no trades')
except Exception as e:
    import traceback
    traceback.print_exc()
    print('ERROR:', e)
