#!/usr/bin/env python
"""Test API with multiple symbols including GOOGL."""
import urllib.request
import json

# Test with wider date range to get full data
url = 'http://127.0.0.1:8000/api/data/ohlcv?symbols=AAPL,MSFT,GOOGL&start_date=2020-01-01&end_date=2025-11-21'

print(f"Fetching: {url}\n")

try:
    with urllib.request.urlopen(url, timeout=20) as response:
        data = json.loads(response.read().decode())
        
        print("Response Success:", data.get('success'))
        print("Message:", data.get('message'))
        print("\nData Summary:")
        record_count = data['data'].get('record_count', {})
        for symbol in ['AAPL', 'MSFT', 'GOOGL']:
            count = record_count.get(symbol, 0)
            print(f"  {symbol}: {count} data points")
        
        print("\nSymbols requested:", data['data'].get('symbols'))
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
