#!/usr/bin/env python
"""Check database contents."""
import sqlite3

db_path = 'data/app.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cur.fetchall()
print('Tables:', [t[0] for t in tables])

# Check market_data
cur.execute('SELECT DISTINCT symbol FROM market_data ORDER BY symbol')
symbols = cur.fetchall()
print('\nSymbols in DB:', [s[0] for s in symbols])

# Count records per symbol
cur.execute('SELECT symbol, COUNT(*) as count FROM market_data GROUP BY symbol ORDER BY symbol')
counts = cur.fetchall()
print('\nRecords per symbol:')
for sym, count in counts:
    print(f'  {sym}: {count}')

# Check date range for each symbol
cur.execute('SELECT symbol, MIN(date), MAX(date) FROM market_data GROUP BY symbol ORDER BY symbol')
date_ranges = cur.fetchall()
print('\nDate range per symbol:')
for sym, min_date, max_date in date_ranges:
    print(f'  {sym}: {min_date} to {max_date}')

conn.close()
