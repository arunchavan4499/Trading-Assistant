import sys
import os
from dotenv import load_dotenv

# Add the project root to the python path
sys.path.append(os.getcwd())

# Load .env from quant_trade_MP/.env
load_dotenv(os.path.join(os.getcwd(), 'quant_trade_MP', '.env'))

from app.services.semantic_search import SemanticSymbolSearchService

def test_search():
    try:
        service = SemanticSymbolSearchService()
        query = "Apple"
        print(f"Searching for '{query}'...")
        results = service.search(query, limit=5)
        
        if not results:
            print("No results found.")
        else:
            print(f"Found {len(results)} results:")
            for r in results:
                print(f"  {r.symbol}: {r.name} (Score: {r.score})")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_search()
