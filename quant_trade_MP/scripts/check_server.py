import requests
import time
import sys

def check_health():
    url = "http://127.0.0.1:8000/health"
    for i in range(10):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print("Server is healthy!")
                return
        except requests.exceptions.ConnectionError:
            print(f"Attempt {i+1}: Server not ready yet...")
            time.sleep(2)
    print("Server failed to start.")
    sys.exit(1)

if __name__ == "__main__":
    check_health()
