#!/usr/bin/env python
"""Test script to fetch OHLCV data from the API and inspect values."""

import urllib.request
import json

url = 'http://127.0.0.1:8000/api/data/ohlcv?symbols=AAPL&start_date=2024-12-16&end_date=2025-01-31'

print(f"Fetching: {url}\n")

try:
    with urllib.request.urlopen(url, timeout=20) as response:
        data = json.loads(response.read().decode())
        
        print("Response Success:", data.get('success'))
        print("Message:", data.get('message'))
        print("\nData Summary:")
        print("  Symbols:", data['data'].get('symbols'))
        print("  Date Range:", data['data'].get('date_range'))
        print("  Record Count:", data['data'].get('record_count'))
        
        print("\nFirst 5 OHLCV records for AAPL:")
        aapl_data = data['data']['data'].get('AAPL', [])
        for i, record in enumerate(aapl_data[:5]):
            print(f"  {i+1}. {record}")
        
        if len(aapl_data) > 5:
            print(f"  ... ({len(aapl_data) - 5} more records)")
            
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
