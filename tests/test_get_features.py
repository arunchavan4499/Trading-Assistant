import requests
import sys

def test_get_features():
    # Assuming SPY features were computed previously or will be computed on the fly
    # We'll use a symbol that likely exists or will be fetched
    symbol = "SPY"
    url = f"http://127.0.0.1:8000/api/features/{symbol}?start_date=2023-01-01&end_date=2023-12-31"
    
    print(f"Testing GET {url}")
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Success!")
            print(f"Data keys: {data.keys()}")
            if 'data' in data and symbol in data['data']:
                print(f"Features for {symbol}: {len(data['data'][symbol])} records")
            else:
                print("Unexpected response structure")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_get_features()
