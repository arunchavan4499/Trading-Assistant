from __future__ import annotations

import asyncio
import logging
from typing import Optional

import requests
from requests import RequestException

logger = logging.getLogger(__name__)


class YahooSymbolLookupService:
    """Thin wrapper around Yahoo Finance suggestion API for ticker lookup."""

    def __init__(
        self,
        base_url: str = "https://query2.finance.yahoo.com/v1/finance/search",
        timeout: float = 6.0,
        session: Optional[requests.Session] = None,
    ) -> None:
        self.base_url = base_url
        self.timeout = timeout
        self._session = session or requests.Session()

    @staticmethod
    def _normalize(value: Optional[str]) -> str:
        return (value or "").strip().upper()

    def _search_symbol_sync(self, query: str) -> Optional[str]:
        cleaned = (query or "").strip()
        if not cleaned:
            return None

        params = {
            "q": cleaned,
            "lang": "en-US",
            "region": "US",
            "quotesCount": 8,
            "quotesQueryId": "tss_match_phrase_query",
            "multiQuoteQueryId": "multi_quote_single_token_query",
            "enableCb": True,
        }

        try:
            response = self._session.get(self.base_url, params=params, timeout=self.timeout)
            response.raise_for_status()
        except RequestException as exc:
            logger.warning("Yahoo lookup failed for '%s': %s", cleaned, exc)
            return None

        try:
            payload = response.json()
        except ValueError as exc:
            logger.warning("Yahoo lookup returned invalid JSON for '%s': %s", cleaned, exc)
            return None

        quotes = payload.get("quotes", []) if isinstance(payload, dict) else []
        if not isinstance(quotes, list):
            quotes = []

        normalized_query = self._normalize(cleaned)

        # Prefer exact ticker matches first.
        for quote in quotes:
            symbol = self._normalize(quote.get("symbol")) if isinstance(quote, dict) else ""
            if symbol and symbol == normalized_query:
                return symbol

        # Fallback: return the first viable symbol Yahoo suggests.
        for quote in quotes:
            symbol = self._normalize(quote.get("symbol")) if isinstance(quote, dict) else ""
            if symbol:
                return symbol

        return None

    async def search_symbol(self, query: str) -> Optional[str]:
        """Resolve a free-form user query to a Yahoo-recognized ticker."""
        return await asyncio.to_thread(self._search_symbol_sync, query)
