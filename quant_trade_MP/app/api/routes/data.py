"""Market data endpoints."""

from datetime import datetime
import logging
from typing import Optional, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query
from requests import RequestException
import requests
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.services.semantic_search import SemanticSymbolSearchService
from app.services.symbol_resolver import resolve_symbol, resolve_symbols
from app.services.international_symbols import get_international_ticker

try:
    from app.services.data_fetcher import DataFetcher
    _data_fetcher_available = True
except Exception:
    DataFetcher = None
    _data_fetcher_available = False
from app.dependencies.db import get_db
from app.models.database import MarketData
from app.models.schemas import (
    FetchOHLCVRequest,
    OHLCVResponse,
    OHLCVData,
    DataSummary,
    SymbolInfo,
    ApiResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/data", tags=["market_data"])

YAHOO_SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search"
YAHOO_TIMEOUT = 6  # seconds
try:
    semantic_search_service = SemanticSymbolSearchService()
except Exception as sem_exc:  # pragma: no cover - optional dependency issues
    logger.warning("Semantic search service unavailable: %s", sem_exc)
    semantic_search_service = None


@router.post("/fetch", response_model=ApiResponse)
async def fetch_ohlcv_data(request: FetchOHLCVRequest):
    """
    Fetch OHLCV data for symbols and optionally save to database.
    
    - **symbols**: List of ticker symbols (e.g., ["AAPL", "MSFT"])
    - **start_date**: Start date in YYYY-MM-DD format
    - **end_date**: End date in YYYY-MM-DD format
    - **save_to_db**: Whether to save fetched data to database
    """
    try:
        resolved_symbols, unresolved = await resolve_symbols(request.symbols)
        if unresolved:
            raise HTTPException(status_code=400, detail=f"Unable to resolve symbols: {', '.join(unresolved)}")
        if not resolved_symbols:
            raise HTTPException(status_code=400, detail="No valid symbols provided")

        logger.info(
            "Fetching OHLCV data for %s from %s to %s",
            resolved_symbols,
            request.start_date,
            request.end_date,
        )

        if not _data_fetcher_available or DataFetcher is None:
            raise HTTPException(status_code=503, detail="DataFetcher service unavailable (missing dependencies)")

        data_fetcher = DataFetcher()
        # Fetch data from yfinance or data source
        data = data_fetcher.fetch_ohlcv(
            symbols=resolved_symbols,
            start=request.start_date,
            end=request.end_date,
            save_to_db=request.save_to_db
        )
        
        if not data:
            raise HTTPException(status_code=400, detail="No data fetched for symbols")
        
        # Convert to response format
        ohlcv_data = {}
        record_count = {}
        
        for symbol, df in data.items():
            records = []
            for idx, row in df.iterrows():
                records.append(
                    OHLCVData(
                        date=idx.strftime("%Y-%m-%d"),
                        open=float(row.get("open", 0)),
                        high=float(row.get("high", 0)),
                        low=float(row.get("low", 0)),
                        close=float(row.get("close", 0)),
                        adj_close=float(row.get("adj_close", 0)),
                        volume=int(row.get("volume", 0)),
                    )
                )
            ohlcv_data[symbol] = records
            record_count[symbol] = len(records)
        
        response_data = {
            "data": ohlcv_data,
            "symbols": resolved_symbols,
            "date_range": {
                "start_date": request.start_date,
                "end_date": request.end_date,
            },
            "record_count": record_count,
        }
        
        return ApiResponse(
            success=True,
            data=response_data,
            message=f"Fetched data for {len(resolved_symbols)} symbols",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error fetching OHLCV data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")


@router.get("/ohlcv", response_model=ApiResponse)
async def get_ohlcv_data(
    symbols: str = Query(..., description="Comma-separated list of symbols"),
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
):
    """
    Get OHLCV data for symbols from database or cache.
    
    - **symbols**: Comma-separated ticker symbols (e.g., "AAPL,MSFT,GOOGL")
    - **start_date**: Start date in YYYY-MM-DD format
    - **end_date**: End date in YYYY-MM-DD format
    """
    try:
        raw_symbol_list = [s for s in symbols.split(",")]
        symbol_list, unresolved = await resolve_symbols(raw_symbol_list)
        if unresolved:
            raise HTTPException(status_code=400, detail=f"Unable to resolve symbols: {', '.join(unresolved)}")
        if not symbol_list:
            raise HTTPException(status_code=400, detail="No valid symbols provided")

        logger.info("Loading OHLCV data for %s", symbol_list)

        if not _data_fetcher_available or DataFetcher is None:
            raise HTTPException(status_code=503, detail="DataFetcher service unavailable (missing dependencies)")

        data_fetcher = DataFetcher()
        # Try database first
        data = data_fetcher.load_from_db(
            symbols=symbol_list,
            start=start_date,
            end=end_date
        )

        if not data:
            logger.info("No cached OHLCV data found; fetching fresh data for %s", symbol_list)
            data = data_fetcher.fetch_ohlcv(
                symbols=symbol_list,
                start=start_date,
                end=end_date,
                save_to_db=True,
            )

        if not data:
            raise HTTPException(status_code=404, detail="No data available for requested symbols/date range")
        
        # Convert to response format
        ohlcv_data = {}
        record_count = {}
        
        for symbol, df in data.items():
            records = []
            for idx, row in df.iterrows():
                records.append(
                    OHLCVData(
                        date=idx.strftime("%Y-%m-%d"),
                        open=float(row.get("open", 0)),
                        high=float(row.get("high", 0)),
                        low=float(row.get("low", 0)),
                        close=float(row.get("close", 0)),
                        adj_close=float(row.get("adj_close", 0)),
                        volume=int(row.get("volume", 0)),
                    )
                )
            ohlcv_data[symbol] = records
            record_count[symbol] = len(records)
        
        response_data = {
            "data": ohlcv_data,
            "symbols": symbol_list,
            "date_range": {
                "start_date": start_date,
                "end_date": end_date,
            },
            "record_count": record_count,
        }
        
        return ApiResponse(
            success=True,
            data=response_data,
            message=f"Retrieved data for {len(symbol_list)} symbols",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error loading OHLCV data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error loading data: {str(e)}")


@router.get("/summary", response_model=ApiResponse)
async def get_data_summary(db: Session = Depends(get_db)):
    """
    Get summary of available market data in database.
    Returns coverage information for all symbols with data.
    """
    try:
        logger.info("Generating data summary")
        
        coverage_rows = (
            db.query(
                MarketData.symbol.label("symbol"),
                func.min(MarketData.date).label("start_date"),
                func.max(MarketData.date).label("end_date"),
                func.count().label("count"),
            )
            .group_by(MarketData.symbol)
            .order_by(MarketData.symbol)
            .all()
        )

        coverage: Dict[str, Dict[str, str]] = {}
        start_dates = []
        end_dates = []
        for row in coverage_rows:
            if not row.symbol:
                continue
            start_iso = row.start_date.isoformat() if row.start_date else None
            end_iso = row.end_date.isoformat() if row.end_date else None
            coverage[row.symbol] = {
                "start_date": start_iso,
                "end_date": end_iso,
                "record_count": int(row.count),
            }
            if start_iso:
                start_dates.append(row.start_date)
            if end_iso:
                end_dates.append(row.end_date)

        date_range = {
            "start_date": min(start_dates).isoformat() if start_dates else None,
            "end_date": max(end_dates).isoformat() if end_dates else None,
        }

        summary = {
            "symbols": list(coverage.keys()),
            "coverage": coverage,
            "total_symbols": len(coverage),
            "date_range": date_range,
        }
        
        return ApiResponse(
            success=True,
            data=summary,
            message="Data summary generated",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error generating data summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")


@router.get("/symbols", response_model=ApiResponse)
async def get_available_symbols(db: Session = Depends(get_db)):
    """
    Get list of all symbols with available data.
    """
    try:
        logger.info("Fetching available symbols")
        
        symbols = [
            row[0]
            for row in db.query(MarketData.symbol)
            .distinct()
            .order_by(MarketData.symbol)
            .all()
            if row[0]
        ]
        
        return ApiResponse(
            success=True,
            data={"symbols": symbols},
            message=f"Retrieved {len(symbols)} available symbols",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error fetching symbols: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching symbols: {str(e)}")


@router.get("/search", response_model=ApiResponse)
def search_symbols(
    query: str = Query(..., min_length=2, max_length=64, description="Symbol or company name fragment"),
    limit: int = Query(8, ge=1, le=25, description="Maximum number of suggestions to return"),
    db: Session = Depends(get_db),
):
    """Search tickers by symbol or company name using Yahoo Finance, international mapping, and DB fallback."""
    try:
        q = query.strip()
        if not q:
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        suggestions: List[SymbolInfo] = []
        seen_symbols = set()

        # Check for international symbol mapping first (e.g., "samsung" -> "005930.KS")
        intl_ticker = get_international_ticker(q)
        if intl_ticker:
            suggestions.append(
                SymbolInfo(
                    symbol=intl_ticker,
                    name=f"{q.title()} (International)",
                    exchange="International",
                    asset_type="Equity",
                    ticker=intl_ticker,
                )
            )
            seen_symbols.add(intl_ticker)

        if semantic_search_service:
            try:
                semantic_matches = semantic_search_service.search(q, limit)
                for match in semantic_matches:
                    if match.symbol not in seen_symbols:
                        suggestions.append(match)
                        seen_symbols.add(match.symbol)
            except Exception as sem_err:
                logger.warning("Semantic search failed: %s", sem_err)

        params = {
            "q": q,
            "lang": "en-US",
            "region": "US",
            "quotesCount": limit,
            "quotesQueryId": "tss_match_phrase_query",
            "multiQuoteQueryId": "multi_quote_single_token_query",
            "enableCb": True,
        }

        if len(suggestions) < limit:
            try:
                response = requests.get(YAHOO_SEARCH_URL, params=params, timeout=YAHOO_TIMEOUT)
                response.raise_for_status()
                payload = response.json()
                for quote in payload.get("quotes", []):
                    symbol = quote.get("symbol")
                    if not symbol or symbol in seen_symbols:
                        continue
                    name = quote.get("shortname") or quote.get("longname") or quote.get("name")
                    suggestions.append(
                        SymbolInfo(
                            symbol=symbol.upper(),
                            name=name,
                            exchange=quote.get("exchDisp") or quote.get("exch"),
                            asset_type=quote.get("typeDisp") or quote.get("quoteType"),
                            ticker=symbol.upper(),
                        )
                    )
                    seen_symbols.add(symbol.upper())
                    if len(suggestions) >= limit:
                        break
            except RequestException as yahoo_err:
                logger.warning("Yahoo symbol search failed: %s", yahoo_err)

        if len(suggestions) < limit:
            pattern = f"%{q.upper()}%"
            rows = (
                db.query(MarketData.symbol)
                .filter(MarketData.symbol.ilike(pattern))
                .limit(limit - len(suggestions))
                .all()
            )
            for row in rows:
                symbol = row[0]
                if not symbol or symbol in seen_symbols:
                    continue
                suggestions.append(SymbolInfo(symbol=symbol, ticker=symbol))
                seen_symbols.add(symbol)

        payload = {
            "suggestions": [s.model_dump(by_alias=True) for s in suggestions[:limit]],
        }

        return ApiResponse(
            success=True,
            data=payload,
            message=f"Found {len(payload['suggestions'])} symbol matches",
            timestamp=datetime.utcnow().isoformat(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error searching symbols: %s", e)
        raise HTTPException(status_code=500, detail=f"Error searching symbols: {str(e)}")
