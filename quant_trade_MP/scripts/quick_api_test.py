"""
Quick API test - verify server is responding
"""
import sys
import urllib.request
import json

def test_endpoint(url, name):
    """Test a single endpoint."""
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode())
            print(f"✓ {name}: {data}")
            return True
    except Exception as e:
        print(f"✗ {name}: {e}")
        return False

if __name__ == "__main__":
    print("Testing FastAPI Server on http://127.0.0.1:8000")
    print("=" * 60)
    
    tests = [
        ("http://127.0.0.1:8000/", "Root endpoint"),
        ("http://127.0.0.1:8000/health", "Health check"),
        ("http://127.0.0.1:8000/api/user/me", "User endpoint"),
        ("http://127.0.0.1:8000/api/risk/status", "Risk status"),
    ]
    
    results = [test_endpoint(url, name) for url, name in tests]
    
    print("=" * 60)
    print(f"Results: {sum(results)}/{len(results)} passed")
    
    if all(results):
        print("\n✓ Server is running and responding correctly!")
        print("✓ API Documentation: http://127.0.0.1:8000/docs")
        print("✓ Backend integration verified!")
    else:
        print("\n✗ Some endpoints failed")
        sys.exit(1)
