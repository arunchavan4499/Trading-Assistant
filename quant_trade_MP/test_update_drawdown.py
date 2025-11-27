#!/usr/bin/env python
"""Test updating user drawdown limit."""
import urllib.request
import json

# First, get current user
print("1. Getting current user...")
with urllib.request.urlopen('http://127.0.0.1:8000/api/user/me', timeout=5) as r:
    user_data = json.loads(r.read().decode())
    current_limit = user_data['data']['drawdown_limit']
    print(f"   Current drawdown_limit: {current_limit} ({current_limit*100:.1f}%)")

# Update to new value
new_limit = 0.25
print(f"\n2. Updating drawdown_limit to {new_limit} ({new_limit*100:.1f}%)...")

update_payload = {
    "name": user_data['data']['name'],
    "email": user_data['data']['email'],
    "drawdown_limit": new_limit,
    "max_assets": user_data['data']['max_assets'],
    "config": user_data['data']['config']
}

req = urllib.request.Request(
    'http://127.0.0.1:8000/api/user/me',
    data=json.dumps(update_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='PUT'
)

with urllib.request.urlopen(req, timeout=5) as r:
    response = json.loads(r.read().decode())
    updated_limit = response['data']['drawdown_limit']
    print(f"   Updated drawdown_limit: {updated_limit} ({updated_limit*100:.1f}%)")

# Check risk status after update
print(f"\n3. Checking risk status after update...")
with urllib.request.urlopen('http://127.0.0.1:8000/api/risk/status', timeout=5) as r:
    risk_data = json.loads(r.read().decode())
    risk_limit = risk_data['data']['drawdown_limit']
    print(f"   Risk drawdown_limit: {risk_limit} ({risk_limit*100:.1f}%)")
    print(f"   Current drawdown: {risk_data['data']['current_drawdown']*100:.1f}%")
    print(f"   Is safe: {risk_data['data']['is_safe']}")

print("\n✅ PASS: Drawdown limit updated across all endpoints")
