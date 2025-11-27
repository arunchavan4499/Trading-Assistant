#!/usr/bin/env python
"""Test that drawdown limits are updating correctly."""
import urllib.request
import json

# Test risk endpoints
for endpoint in ['/api/risk/status', '/api/risk/limits']:
    try:
        url = f'http://127.0.0.1:8000{endpoint}'
        with urllib.request.urlopen(url, timeout=5) as r:
            data = json.loads(r.read().decode())
            print(f'\n{endpoint}:')
            
            if 'drawdown_limit' in data.get('data', {}):
                dd_limit = data['data']['drawdown_limit']
                print(f'  drawdown_limit: {dd_limit} ({dd_limit*100:.1f}%)')
            
            if 'max_drawdown_limit' in data.get('data', {}):
                max_dd = data['data']['max_drawdown_limit']
                print(f'  max_drawdown_limit: {max_dd} ({max_dd*100:.1f}%)')
                
            if 'limits' in data.get('data', {}):
                max_dd = data['data']['limits'].get('max_drawdown')
                print(f'  limits.max_drawdown: {max_dd} ({max_dd*100:.1f}%)')
                
            if 'current_drawdown' in data.get('data', {}):
                curr_dd = data['data']['current_drawdown']
                print(f'  current_drawdown: {curr_dd} ({curr_dd*100:.1f}%)')
    except Exception as e:
        print(f'ERROR at {endpoint}: {e}')
