#!/usr/bin/env python
"""Test the /api/user/me endpoint."""
import urllib.request
import json

url = 'http://127.0.0.1:8000/api/user/me'

print(f"Fetching: {url}\n")

try:
    with urllib.request.urlopen(url, timeout=10) as response:
        data = json.loads(response.read().decode())
        print("Success:")
        print(json.dumps(data, indent=2))
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.reason}")
    try:
        error_data = json.loads(e.read().decode())
        print(json.dumps(error_data, indent=2))
    except:
        print(e.read().decode())
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
