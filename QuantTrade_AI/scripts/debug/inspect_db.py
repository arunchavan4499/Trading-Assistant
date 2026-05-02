#!/usr/bin/env python
"""Inspect market_data table directly."""

from app.models.database import SessionLocal, MarketData

db = SessionLocal()

# Count total records
total = db.query(MarketData).filter(MarketData.symbol == 'AAPL').count()
print(f"Total AAPL records in DB: {total}")

# Fetch first 5
rows = db.query(MarketData).filter(MarketData.symbol == 'AAPL').limit(5).all()

print("\nFirst 5 records:")
for r in rows:
    print(f"  {r.date}: O={r.open} H={r.high} L={r.low} C={r.close} V={r.volume}")

# Check if any have non-zero values
non_zero = db.query(MarketData).filter(
    MarketData.symbol == 'AAPL',
    MarketData.close > 0
).count()

print(f"\nRecords with close > 0: {non_zero}")

db.close()
