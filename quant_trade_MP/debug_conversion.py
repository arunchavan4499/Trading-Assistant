#!/usr/bin/env python
"""Debug the OHLCV conversion logic from data.py."""

from app.services.data_fetcher import DataFetcher
from app.models.schemas import OHLCVData

fetcher = DataFetcher()

# Load real data
data = fetcher.load_from_db(
    symbols=['AAPL'],
    start='2024-12-16',
    end='2025-01-31'
)

print("Raw DataFrame (first 3 rows):")
df = data['AAPL']
print(df.head(3))
print(f"\nColumn names: {list(df.columns)}")
print(f"Index name: {df.index.name}")

# Replicate the conversion logic from data.py lines 118-127
print("\n\nTesting conversion logic:")
records = []
for idx, row in df.iterrows():
    print(f"\nProcessing row index: {idx} (type: {type(idx)})")
    print(f"  strftime result: {idx.strftime('%Y-%m-%d')}")
    print(f"  row.get('Open', 0): {row.get('Open', 0)}")
    print(f"  row.get('open', 0): {row.get('open', 0)}")
    
    # This is what the endpoint does
    ohlcv = OHLCVData(
        date=idx.strftime("%Y-%m-%d"),
        open=float(row.get("Open", 0)),  # <-- PROBLEM: Looking for 'Open' but df has 'open'
        high=float(row.get("High", 0)),
        low=float(row.get("Low", 0)),
        close=float(row.get("Close", 0)),
        adj_close=float(row.get("Adj Close", 0)),
        volume=int(row.get("Volume", 0)),
    )
    records.append(ohlcv)
    if len(records) >= 3:
        break

print("\n\nConverted records (first 3):")
for r in records:
    print(f"  {r}")
