#!/usr/bin/env python
"""Debug database configuration"""
import os
import sys

# Add the project to the path
sys.path.insert(0, os.getcwd())

from app.core.config import settings

print("Database Debug Info:")
print(f"  DATABASE_URL: {settings.DATABASE_URL}")
print(f"  Current working directory: {os.getcwd()}")
print(f"  Data directory exists: {os.path.exists('data')}")
print(f"  DB file exists: {os.path.exists('data/app.db')}")
print(f"  DB file absolute path: {os.path.abspath('data/app.db')}")

# Try to create the engine
try:
    from app.models.database import engine
    print(f"  Engine created: {engine}")
    
    # Try to connect
    with engine.connect() as conn:
        print("  ✅ Database connection successful!")
except Exception as e:
    print(f"  ❌ Database connection failed: {e}")
