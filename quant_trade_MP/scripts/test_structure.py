import requests
import json

def test_get_features_structure():
    symbol = "SPY"
    url = f"http://127.0.0.1:8000/api/features/{symbol}?start_date=2023-01-01&end_date=2023-12-31"
    
    print(f"Testing GET {url}")
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            print("Success!")
            # Check structure
            if 'data' in data:
                inner_data = data['data']
                print(f"Inner data keys: {inner_data.keys()}")
                if 'features' in inner_data:
                    print(f"Found 'features' key with {len(inner_data['features'])} records.")
                else:
                    print("MISSING 'features' key!")
                
                if 'symbol' in inner_data:
                    print(f"Found 'symbol' key: {inner_data['symbol']}")
                else:
                    print("MISSING 'symbol' key!")
            else:
                print("Missing 'data' key in response")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_get_features_structure()
