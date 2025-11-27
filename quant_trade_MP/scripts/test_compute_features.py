import requests
import json

def test_compute_features():
    url = "http://127.0.0.1:8000/api/features/compute"
    payload = {
        "symbols": ["SPY"],
        "start_date": "2023-01-01",
        "end_date": "2023-12-31",
        "save": True
    }
    
    print(f"Testing POST {url}")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Success!")
            data = response.json()
            print(f"Message: {data.get('message')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_compute_features()
