"""
Test script to verify FastAPI server is running and all endpoints work.
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test health endpoint."""
    print("\n1. Testing /health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Server is healthy: {data}")
            return True
        else:
            print(f"   ✗ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ Health check error: {e}")
        return False

def test_root():
    """Test root endpoint."""
    print("\n2. Testing / (root) endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Root endpoint: {data['message']}")
            return True
        else:
            print(f"   ✗ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ Root endpoint error: {e}")
        return False

def test_fetch_market_data():
    """Test market data fetch endpoint."""
    print("\n3. Testing /api/market-data/fetch endpoint...")
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        payload = {
            "symbols": ["AAPL", "MSFT"],
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "save_to_db": True
        }
        
        response = requests.post(f"{BASE_URL}/api/market-data/fetch", json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Fetched data for {len(data.get('symbols', []))} symbols")
            return True
        else:
            print(f"   ✗ Market data fetch failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"   ✗ Market data fetch error: {e}")
        return False

def test_get_market_data():
    """Test get market data endpoint."""
    print("\n4. Testing /api/market-data/{symbol} endpoint...")
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        params = {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d")
        }
        
        response = requests.get(f"{BASE_URL}/api/market-data/AAPL", params=params)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Retrieved AAPL data: {len(data.get('data', []))} records")
            return True
        else:
            print(f"   ✗ Get market data failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ Get market data error: {e}")
        return False

def test_construct_portfolio():
    """Test portfolio construction endpoint."""
    print("\n5. Testing /api/portfolio/construct endpoint...")
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=180)
        
        payload = {
            "symbols": ["AAPL", "MSFT", "GOOGL"],
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "method": "sparse_mean_reverting",
            "sparsity_k": 3,
            "max_weight": 0.5,
            "ridge_lambda": 0.001
        }
        
        response = requests.post(f"{BASE_URL}/api/portfolio/construct", json=payload)
        if response.status_code == 200:
            data = response.json()
            weights = data.get('weights', {})
            metrics = data.get('metrics', {})
            print(f"   ✓ Portfolio constructed:")
            print(f"     Weights: {weights}")
            print(f"     Metrics: {metrics}")
            return True
        else:
            print(f"   ✗ Portfolio construction failed: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return False
    except Exception as e:
        print(f"   ✗ Portfolio construction error: {e}")
        return False

def test_generate_signals():
    """Test signal generation endpoint."""
    print("\n6. Testing /api/signals/generate endpoint...")
    try:
        payload = {
            "target_weights": {"AAPL": 0.4, "MSFT": 0.3, "GOOGL": 0.3},
            "current_qty": {"AAPL": 100, "MSFT": 50, "GOOGL": 30},
            "prices": {"AAPL": 180.0, "MSFT": 350.0, "GOOGL": 140.0},
            "capital": 100000
        }
        
        response = requests.post(f"{BASE_URL}/api/signals/generate", json=payload)
        if response.status_code == 200:
            data = response.json()
            plan = data.get('data', {})
            trades = plan.get('trades', {})
            print(f"   ✓ Signal generation successful:")
            print(f"     Trades: {len(trades)} signals")
            for symbol, trade_info in trades.items():
                print(f"       {symbol}: {trade_info.get('side')}")
            return True
        else:
            print(f"   ✗ Signal generation failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ Signal generation error: {e}")
        return False

def test_get_user():
    """Test user endpoint."""
    print("\n7. Testing /api/user endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/user")
        if response.status_code == 200:
            data = response.json()
            user = data.get('data', {})
            print(f"   ✓ User data retrieved:")
            print(f"     Name: {user.get('name')}")
            print(f"     Capital: ${user.get('capital'):,.2f}")
            return True
        else:
            print(f"   ✗ Get user failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ Get user error: {e}")
        return False

def test_risk_status():
    """Test risk status endpoint."""
    print("\n8. Testing /api/risk/status endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/risk/status")
        if response.status_code == 200:
            data = response.json()
            risk = data.get('data', {})
            print(f"   ✓ Risk status retrieved:")
            print(f"     Drawdown: {risk.get('current_drawdown')*100:.2f}%")
            print(f"     Status: {'SAFE' if risk.get('is_safe') else 'WARNING'}")
            return True
        else:
            print(f"   ✗ Get risk status failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ✗ Get risk status error: {e}")
        return False

def main():
    """Run all API tests."""
    print("=" * 60)
    print("FASTAPI SERVER INTEGRATION TEST")
    print("=" * 60)
    
    tests = [
        test_health,
        test_root,
        test_fetch_market_data,
        test_get_market_data,
        test_construct_portfolio,
        test_generate_signals,
        test_get_user,
        test_risk_status
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"\n   ✗ Test {test.__name__} crashed: {e}")
            results.append(False)
    
    print("\n" + "=" * 60)
    print(f"TEST SUMMARY: Passed: {sum(results)}/{len(results)}")
    print("=" * 60)
    
    if all(results):
        print("\n✓ ALL API TESTS PASSED!")
        print("\nServer is ready for frontend integration.")
        print(f"API Documentation: {BASE_URL}/docs")
    else:
        print("\n✗ Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()
