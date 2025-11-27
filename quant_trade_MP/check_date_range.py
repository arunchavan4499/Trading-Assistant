#!/usr/bin/env python
"""Check date range in database."""

from app.models.database import SessionLocal, MarketData
from sqlalchemy import func

db = SessionLocal()

# Get min and max dates in DB
result = db.query(
    func.min(MarketData.date).label('min_date'),
    func.max(MarketData.date).label('max_date')
).filter(MarketData.symbol == 'AAPL').first()

print(f"AAPL data date range in DB:")
print(f"  Min: {result.min_date}")
print(f"  Max: {result.max_date}")

db.close()
