#!/usr/bin/env python
"""Test script to check API endpoints"""
import requests
import json

endpoints = [
    "/api/portfolio/runs",
    "/api/backtest/runs",
    "/api/risk/status",
    "/api/features",
]

base = "http://localhost:8000"

print("\n" + "="*70)
print("BACKEND API DIAGNOSTICS")
print("="*70 + "\n")

for endpoint in endpoints:
    try:
        print(f"Testing: {endpoint}")
        r = requests.get(base + endpoint, timeout=3)
        print(f"  Status: {r.status_code}")
        
        if r.status_code >= 400:
            try:
                data = r.json()
                error_msg = data.get('detail', str(data))
                print(f"  ❌ Error: {error_msg}")
            except:
                print(f"  ❌ Error: {r.text[:200]}")
        else:
            try:
                data = r.json()
                if isinstance(data, list):
                    print(f"  ✅ OK: {len(data)} items returned")
                    if len(data) > 0:
                        print(f"     Sample: {json.dumps(data[0], indent=6)[:200]}")
                else:
                    print(f"  ✅ OK: {json.dumps(data, indent=6)[:200]}")
            except:
                print(f"  ✅ OK: {len(r.text)} bytes")
    except Exception as e:
        print(f"  ❌ Failed: {str(e)}\n")
    
    print()

print("="*70)
print("\nDiagnostics complete!")
