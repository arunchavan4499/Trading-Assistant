#!/usr/bin/env python
"""
Seed the ticker metadata database with common stocks for semantic search.
This enables autocomplete to work for company names like "Apple" -> AAPL.
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.services.semantic_search import SemanticSymbolSearchService, SymbolMetadataRecord

# Common stocks to seed (expand this list as needed)
COMMON_STOCKS = [
    # Tech Giants
    SymbolMetadataRecord("AAPL", "Apple Inc.", "Technology company", "NASDAQ", "Technology", ["Apple"]),
    SymbolMetadataRecord("MSFT", "Microsoft Corporation", "Software and cloud services", "NASDAQ", "Technology", ["Microsoft"]),
    SymbolMetadataRecord("GOOGL", "Alphabet Inc.", "Technology conglomerate", "NASDAQ", "Technology", ["Google", "Alphabet"]),
    SymbolMetadataRecord("AMZN", "Amazon.com Inc.", "E-commerce and cloud computing", "NASDAQ", "Consumer Cyclical", ["Amazon"]),
    SymbolMetadataRecord("META", "Meta Platforms Inc.", "Social media", "NASDAQ", "Technology", ["Facebook", "Meta"]),
    SymbolMetadataRecord("TSLA", "Tesla Inc.", "Electric vehicles", "NASDAQ", "Consumer Cyclical", ["Tesla"]),
    SymbolMetadataRecord("NVDA", "NVIDIA Corporation", "Graphics processing units", "NASDAQ", "Technology", ["Nvidia"]),
    SymbolMetadataRecord("NFLX", "Netflix Inc.", "Streaming entertainment", "NASDAQ", "Communication Services", ["Netflix"]),
    
    # Financial
    SymbolMetadataRecord("JPM", "JPMorgan Chase & Co.", "Banking and financial services", "NYSE", "Financial", ["JPMorgan", "Chase"]),
    SymbolMetadataRecord("BAC", "Bank of America Corp", "Banking", "NYSE", "Financial", ["Bank of America", "BofA"]),
    SymbolMetadataRecord("WFC", "Wells Fargo & Company", "Banking", "NYSE", "Financial", ["Wells Fargo"]),
    SymbolMetadataRecord("GS", "Goldman Sachs Group Inc.", "Investment banking", "NYSE", "Financial", ["Goldman Sachs"]),
    SymbolMetadataRecord("V", "Visa Inc.", "Payment processing", "NYSE", "Financial", ["Visa"]),
    SymbolMetadataRecord("MA", "Mastercard Inc.", "Payment processing", "NYSE", "Financial", ["Mastercard"]),
    
    # Healthcare
    SymbolMetadataRecord("JNJ", "Johnson & Johnson", "Pharmaceuticals and consumer health", "NYSE", "Healthcare", ["J&J", "Johnson"]),
    SymbolMetadataRecord("UNH", "UnitedHealth Group Inc.", "Healthcare insurance", "NYSE", "Healthcare", ["UnitedHealth"]),
    SymbolMetadataRecord("PFE", "Pfizer Inc.", "Pharmaceuticals", "NYSE", "Healthcare", ["Pfizer"]),
    SymbolMetadataRecord("ABBV", "AbbVie Inc.", "Biopharmaceuticals", "NYSE", "Healthcare", ["AbbVie"]),
    
    # Consumer
    SymbolMetadataRecord("WMT", "Walmart Inc.", "Retail", "NYSE", "Consumer Defensive", ["Walmart"]),
    SymbolMetadataRecord("HD", "Home Depot Inc.", "Home improvement retail", "NYSE", "Consumer Cyclical", ["Home Depot"]),
    SymbolMetadataRecord("DIS", "Walt Disney Company", "Entertainment and media", "NYSE", "Communication Services", ["Disney"]),
    SymbolMetadataRecord("NKE", "Nike Inc.", "Athletic footwear and apparel", "NYSE", "Consumer Cyclical", ["Nike"]),
    SymbolMetadataRecord("MCD", "McDonald's Corporation", "Fast food", "NYSE", "Consumer Cyclical", ["McDonald's", "McDonalds"]),
    SymbolMetadataRecord("SBUX", "Starbucks Corporation", "Coffee chain", "NASDAQ", "Consumer Cyclical", ["Starbucks"]),
    
    # Industrial & Energy
    SymbolMetadataRecord("BA", "Boeing Company", "Aerospace and defense", "NYSE", "Industrials", ["Boeing"]),
    SymbolMetadataRecord("CAT", "Caterpillar Inc.", "Construction equipment", "NYSE", "Industrials", ["Caterpillar"]),
    SymbolMetadataRecord("XOM", "Exxon Mobil Corporation", "Oil and gas", "NYSE", "Energy", ["Exxon", "ExxonMobil"]),
    SymbolMetadataRecord("CVX", "Chevron Corporation", "Oil and gas", "NYSE", "Energy", ["Chevron"]),
    
    # Indices & ETFs
    SymbolMetadataRecord("SPY", "SPDR S&P 500 ETF Trust", "S&P 500 index fund", "NYSE", "ETF", ["S&P 500", "SP500"]),
    SymbolMetadataRecord("QQQ", "Invesco QQQ Trust", "NASDAQ-100 index fund", "NASDAQ", "ETF", ["NASDAQ", "QQQ"]),
    SymbolMetadataRecord("DIA", "SPDR Dow Jones Industrial Average ETF", "Dow Jones index fund", "NYSE", "ETF", ["Dow Jones", "DJIA"]),
    SymbolMetadataRecord("IWM", "iShares Russell 2000 ETF", "Small-cap index fund", "NYSE", "ETF", ["Russell 2000"]),
    SymbolMetadataRecord("VTI", "Vanguard Total Stock Market ETF", "Total market index fund", "NYSE", "ETF", ["Vanguard Total"]),
    
    # International (examples)
    SymbolMetadataRecord("BABA", "Alibaba Group Holding Limited", "E-commerce", "NYSE", "Technology", ["Alibaba"]),
    SymbolMetadataRecord("TSM", "Taiwan Semiconductor Manufacturing", "Semiconductors", "NYSE", "Technology", ["TSMC"]),
    SymbolMetadataRecord("SONY", "Sony Group Corporation", "Electronics and entertainment", "NYSE", "Technology", ["Sony"]),
    SymbolMetadataRecord("005930.KS", "Samsung Electronics", "Electronics and semiconductors", "KRX", "Technology", ["Samsung"]),
]


def main():
    print("Seeding ticker metadata for semantic search...")
    
    service = SemanticSymbolSearchService()
    
    # Upsert all records
    count = service.upsert_metadata(COMMON_STOCKS, embed=True)
    
    print(f"✓ Seeded {count} ticker records with embeddings")
    print("\nTest semantic search:")
    
    # Test some searches
    test_queries = ["apple", "google", "tesla", "bank", "etf"]
    for query in test_queries:
        results = service.search(query, limit=3)
        if results:
            print(f"  '{query}' → {', '.join(r.symbol for r in results)}")
        else:
            print(f"  '{query}' → no results")
    
    print("\nDone! Semantic search is now populated.")


if __name__ == "__main__":
    main()
