#!/usr/bin/env python
"""Test risk endpoints to verify they use user's drawdown limit."""
import urllib.request
import json

urls = [
    'http://127.0.0.1:8000/api/risk/status',
    'http://127.0.0.1:8000/api/risk/limits',
]

for url in urls:
    print(f"\nFetching: {url}")
    print("=" * 80)
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode())
            if data.get('data'):
                if 'limits' in data['data']:
                    print(f"Max Drawdown Limit: {data['data']['limits'].get('max_drawdown', 'N/A')}")
                if 'drawdown_limit' in data['data']:
                    print(f"Current Drawdown Limit: {data['data'].get('drawdown_limit', 'N/A')}")
                    print(f"Current Drawdown: {data['data'].get('current_drawdown', 'N/A')}")
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"ERROR: {e}")
