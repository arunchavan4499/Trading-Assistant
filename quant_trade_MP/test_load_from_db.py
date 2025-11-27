#!/usr/bin/env python
"""Test load_from_db directly."""

from app.services.data_fetcher import DataFetcher

fetcher = DataFetcher()

# Try to load AAPL data for the date range from the API call
data = fetcher.load_from_db(
    symbols=['AAPL'],
    start='2024-12-16',
    end='2025-01-31'
)

print("Loaded data:")
if 'AAPL' in data:
    df = data['AAPL']
    print(f"Shape: {df.shape}")
    print(f"\nFirst 5 rows:")
    print(df.head())
    print(f"\nData types:")
    print(df.dtypes)
    print(f"\nAny non-zero closes: {(df['close'] > 0).any()}")
else:
    print("No AAPL data loaded")
