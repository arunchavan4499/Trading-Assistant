#!/usr/bin/env python
"""Trace the exact issue in endpoint."""

from app.services.data_fetcher import DataFetcher
from app.models.schemas import OHLCVData
import json

print("Testing get_ohlcv_data logic directly\n")

# Simulate the endpoint logic
symbols = "AAPL"
start_date = "2024-12-16"
end_date = "2025-01-31"

symbol_list = [s.strip().upper() for s in symbols.split(",")]
print(f"Symbol list: {symbol_list}")

data_fetcher = DataFetcher()
data = data_fetcher.load_from_db(
    symbols=symbol_list,
    start=start_date,
    end=end_date
)

print(f"\nData returned from load_from_db: {type(data)}")
print(f"Keys: {list(data.keys())}")

if not data:
    print("No data!")
else:
    # Replicate exact endpoint code
    ohlcv_data = {}
    record_count = {}
    
    for symbol, df in data.items():
        print(f"\nProcessing {symbol}:")
        print(f"  DF shape: {df.shape}")
        print(f"  DF columns: {list(df.columns)}")
        print(f"  DF dtypes: {df.dtypes.to_dict()}")
        
        records = []
        for idx, row in df.iterrows():
            print(f"\n  Row index: {idx}, type={type(idx)}")
            print(f"    row type: {type(row)}")
            print(f"    row.get('open', 0) = {row.get('open', 0)}")
            print(f"    row['open'] = {row['open']}")
            
            records.append(
                OHLCVData(
                    date=idx.strftime("%Y-%m-%d"),
                    open=float(row.get("open", 0)),
                    high=float(row.get("high", 0)),
                    low=float(row.get("low", 0)),
                    close=float(row.get("close", 0)),
                    adj_close=float(row.get("adj_close", 0)),
                    volume=int(row.get("volume", 0)),
                )
            )
            
            if len(records) >= 3:
                break
        
        ohlcv_data[symbol] = records
        record_count[symbol] = len(records)
        
        print(f"\n  Records created: {len(records)}")
        for i, rec in enumerate(records):
            print(f"    {i}: {rec}")
