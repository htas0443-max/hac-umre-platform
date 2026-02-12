
import requests
import sys

try:
    response = requests.get("http://localhost:8000/api/health", timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    if response.status_code == 200:
        print("Backend is reachable via HTTP on port 8000")
        sys.exit(0)
    else:
        print("Backend returned non-200 status code")
        sys.exit(1)
except Exception as e:
    print(f"Failed to connect: {e}")
    sys.exit(1)
