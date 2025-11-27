#!/usr/bin/env python
"""Start the server and keep it running."""

import os
import sys
import time

project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

if __name__ == "__main__":
    import uvicorn
    
    print(f"Starting uvicorn from {os.getcwd()}")
    print("Press Ctrl+C to stop the server")
    
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=False,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\nServer stopped")
        sys.exit(0)
