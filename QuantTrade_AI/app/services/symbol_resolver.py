from __future__ import annotations

import asyncio
import logging
from typing import List, Optional, Sequence, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.database import MarketData
from app.services.semantic_search import SemanticSymbolSearchService
from app.services.yahoo import YahooSymbolLookupService
from app.services.international_symbols import get_international_ticker

logger = logging.getLogger(__name__)

try:
    _semantic_service: Optional[SemanticSymbolSearchService] = SemanticSymbolSearchService()
except Exception as exc:  # pragma: no cover - optional dependency issues
    logger.warning("Semantic search service unavailable: %s", exc)
    _semantic_service = None

yahoo_lookup = YahooSymbolLookupService()


def _normalize(value: Optional[str]) -> str:
    return (value or "").strip().upper()


def _symbol_exists_in_db(symbol: str) -> bool:
    """Check if a symbol exists in the database."""
    try:
        from app.models.database import SessionLocal
        db = SessionLocal()
        try:
            exists = db.query(func.count(MarketData.symbol)).filter(
                MarketData.symbol == symbol.upper()
            ).scalar() > 0
            return exists
        finally:
            db.close()
    except Exception as e:
        logger.debug("Error checking symbol in DB: %s", e)
        return False


async def resolve_symbol(user_input: str) -> Optional[str]:
    """Resolve any user-provided text to a canonical ticker symbol."""
    cleaned = (user_input or "").strip()
    if not cleaned:
        return None

    normalized = _normalize(cleaned)

    # First check: exact match in semantic service cache
    if _semantic_service and _semantic_service.symbol_exists(normalized):
        return normalized

    # Second check: Yahoo Finance
    yahoo_match = await yahoo_lookup.search_symbol(cleaned)
    if yahoo_match:
        return yahoo_match

    # Third check: International symbol mapping (e.g., "samsung" -> "005930.KS")
    intl_ticker = get_international_ticker(cleaned)
    if intl_ticker:
        return intl_ticker

    # Fourth check: Database (for international symbols not on Yahoo US)
    if _symbol_exists_in_db(normalized):
        return normalized

    # Fifth check: semantic fallback (closest match)
    if _semantic_service:
        fallback = _semantic_service.closest_match(cleaned)
        if fallback:
            normalized_fallback = _normalize(fallback)
            if _symbol_exists_in_db(normalized_fallback):
                return normalized_fallback
            return normalized_fallback

    return None


async def resolve_symbols(raw_symbols: Sequence[str]) -> Tuple[List[str], List[str]]:
    """Resolve a list of user inputs into tickers, returning unresolved entries too."""
    if not raw_symbols:
        return [], []

    tasks = [resolve_symbol(symbol) for symbol in raw_symbols]
    matches = await asyncio.gather(*tasks, return_exceptions=False)

    resolved: List[str] = []
    unresolved: List[str] = []

    for original, ticker in zip(raw_symbols, matches):
        if ticker:
            resolved.append(_normalize(ticker))
        else:
            cleaned = original.strip() if isinstance(original, str) else str(original)
            if cleaned:
                unresolved.append(cleaned)

    return resolved, unresolved
