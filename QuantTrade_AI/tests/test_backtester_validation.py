from app.services.backtester import Backtester
from app.services.data_fetcher import DataFetcher

def test(require_db=False):
    fetcher = DataFetcher()
    df_map = {}
    for s in ["SPY"]:
        df = fetcher.fetch_ohlcv([s], start="2023-01-01", end="2023-12-31", save_to_db=True).get(s)
        df_map[s] = df
    bt = Backtester()
    try:
        eq, trades = bt.simulate({"SPY": 1.0}, df_map, require_db_source=require_db)
        print("Simulate completed. equity rows:", len(eq))
    except Exception as e:
        print("Simulate raised:", e)

if __name__ == '__main__':
    print('Test without DB requirement:')
    test(require_db=False)
    print('\nTest with DB requirement:')
    test(require_db=True)
