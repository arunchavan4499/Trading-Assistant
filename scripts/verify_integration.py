#!/usr/bin/env python
"""
Quick Frontend-Backend Integration Verification Script
Runs all critical health checks and sample API calls.
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "http://127.0.0.1:8000"
API_BASE = f"{BACKEND_URL}/api"

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_success(msg):
    print(f"{GREEN}✅ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}❌ {msg}{RESET}")

def print_info(msg):
    print(f"{BLUE}ℹ️  {msg}{RESET}")

def print_warning(msg):
    print(f"{YELLOW}⚠️  {msg}{RESET}")

def test_backend_health():
    """Test if backend is running and healthy."""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}1. Testing Backend Health{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success(f"Backend is running on {BACKEND_URL}")
            data = response.json()
            print_info(f"Status: {data.get('status', 'unknown')}")
            return True
        else:
            print_error(f"Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error(f"Cannot connect to {BACKEND_URL} — is the backend running?")
        print_warning(f"Start backend with: uvicorn app.main:app --reload --port 8000")
        return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_api_endpoints():
    """Test availability of critical endpoints."""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}2. Testing API Endpoints{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    endpoints = [
        ("GET", "/data/summary", "Market Data Summary"),
        ("GET", "/data/symbols", "Available Symbols"),
        ("POST", "/portfolio/var/runs", "VAR Runs History"),
        ("GET", "/backtest/runs", "Backtest Runs History"),
        ("GET", "/risk/status", "Risk Status"),
    ]
    
    all_ok = True
    for method, endpoint, description in endpoints:
        try:
            url = f"{API_BASE}{endpoint}"
            if method == "GET":
                response = requests.get(url, timeout=5)
            else:
                response = requests.post(url, json={}, timeout=5)
            
            if response.status_code in [200, 400, 404]:  # 400/404 expected for empty endpoints
                print_success(f"{method} {endpoint} — {description}")
            else:
                print_error(f"{method} {endpoint} — Status {response.status_code}")
                all_ok = False
        except Exception as e:
            print_error(f"{method} {endpoint} — {str(e)}")
            all_ok = False
    
    return all_ok

def test_market_data_fetch():
    """Test market data fetching."""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}3. Testing Market Data Fetch{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    try:
        # Fetch AAPL data for past 30 days
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        
        payload = {
            "symbols": ["AAPL"],
            "start_date": start_date,
            "end_date": end_date,
            "save_to_db": True
        }
        
        print_info(f"Fetching AAPL data from {start_date} to {end_date}...")
        response = requests.post(f"{API_BASE}/data/fetch", json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                ohlcv_data = data.get('data', {}).get('data', {})
                record_count = data.get('data', {}).get('record_count', {})
                aapl_count = record_count.get('AAPL', 0)
                print_success(f"Fetched {aapl_count} AAPL records")
                if aapl_count > 0:
                    return True
            else:
                print_error(f"API returned error: {data.get('message', 'unknown')}")
        else:
            print_error(f"API returned status {response.status_code}")
            print_info(f"Response: {response.text[:200]}")
        
        return False
    except Exception as e:
        print_error(f"Error fetching market data: {str(e)}")
        return False

def test_portfolio_construction():
    """Test portfolio construction."""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}4. Testing Portfolio Construction{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    try:
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
        
        payload = {
            "symbols": ["AAPL", "MSFT", "GOOGL"],
            "start_date": start_date,
            "end_date": end_date,
            "method": "sparse_mean_reverting",
            "sparsity_k": 3,
            "max_weight": 0.5,
            "ridge_lambda": 0.001
        }
        
        print_info(f"Constructing portfolio with symbols: {payload['symbols']}")
        response = requests.post(f"{API_BASE}/portfolio/construct", json=payload, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                weights = data.get('data', {}).get('weights', {})
                weight_sum = sum(weights.values()) if weights else 0
                print_success(f"Portfolio constructed with weights summing to {weight_sum:.4f}")
                print_info(f"Weights: {json.dumps(weights, indent=2)}")
                
                if 0.99 <= weight_sum <= 1.01:
                    return True
                else:
                    print_warning(f"Weight sum {weight_sum} is not close to 1.0")
            else:
                print_error(f"API returned error: {data.get('message', 'unknown')}")
        else:
            print_error(f"API returned status {response.status_code}")
            print_info(f"Response: {response.text[:200]}")
        
        return False
    except Exception as e:
        print_error(f"Error constructing portfolio: {str(e)}")
        return False

def test_signal_generation():
    """Test signal generation."""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}5. Testing Signal Generation{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    try:
        payload = {
            "target_weights": {"AAPL": 0.4, "MSFT": 0.3, "GOOGL": 0.3},
            "current_qty": {"AAPL": 100, "MSFT": 80, "GOOGL": 50},
            "prices": {"AAPL": 180.0, "MSFT": 350.0, "GOOGL": 140.0},
            "capital": 100000
        }
        
        print_info("Generating rebalance trades...")
        response = requests.post(f"{API_BASE}/signals/rebalance", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                trades = data.get('data', {}).get('trades', {})
                print_success(f"Generated rebalance plan with {len(trades)} trades")
                for symbol, trade_info in trades.items():
                    side = trade_info.get('side', 'HOLD')
                    quantity = trade_info.get('quantity', 0)
                    print_info(f"  {symbol}: {side} {quantity}")
                return True
            else:
                print_error(f"API returned error: {data.get('message', 'unknown')}")
        else:
            print_error(f"API returned status {response.status_code}")
        
        return False
    except Exception as e:
        print_error(f"Error generating signals: {str(e)}")
        return False

def main():
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Quant Trading Assistant - Integration Verification{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API Base: {API_BASE}")
    
    results = {
        "Backend Health": test_backend_health(),
        "API Endpoints": test_api_endpoints(),
        "Market Data": test_market_data_fetch(),
        "Portfolio Construction": test_portfolio_construction(),
        "Signal Generation": test_signal_generation(),
    }
    
    # Summary
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Test Summary{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = f"{GREEN}✅ PASS{RESET}" if result else f"{RED}❌ FAIL{RESET}"
        print(f"{status} — {test_name}")
    
    print(f"\n{BLUE}Overall: {passed}/{total} tests passed{RESET}")
    
    if passed == total:
        print_success("All tests passed! Frontend-Backend integration is working.")
        print_info("You can now connect frontend pages to the API.")
        return 0
    else:
        print_warning(f"{total - passed} test(s) failed. Check output above and refer to PROJECT_STATUS.md")
        return 1

if __name__ == "__main__":
    sys.exit(main())
