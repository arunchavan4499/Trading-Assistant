from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Iterable, List, Optional, Sequence

import numpy as np
from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session

from app.models.database import SessionLocal, TickerEmbedding, TickerMetadata
from app.models.schemas import SymbolInfo

logger = logging.getLogger(__name__)


@dataclass
class SymbolMetadataRecord:
    """Lightweight container used when seeding metadata + embeddings."""

    symbol: str
    name: str
    description: Optional[str] = None
    exchange: Optional[str] = None
    sector: Optional[str] = None
    aliases: Optional[Sequence[str]] = None


class SemanticSymbolSearchService:
    """Provides MiniLM + pgvector backed semantic ticker search."""

    def __init__(
        self,
        session_factory=SessionLocal,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        min_score: float = 0.2,
    ) -> None:
        self.session_factory = session_factory
        self.model_name = model_name
        self.min_score = min_score
        self._model: Optional[SentenceTransformer] = None

    # ------------------------------------------------------------------
    # Embedding helpers
    def _get_model(self) -> SentenceTransformer:
        if self._model is None:
            logger.info("Loading embedding model %s", self.model_name)
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def _embed(self, texts: Sequence[str]) -> np.ndarray:
        model = self._get_model()
        vectors = model.encode(list(texts), convert_to_numpy=True, normalize_embeddings=True)
        if isinstance(vectors, list):
            vectors = np.asarray(vectors, dtype=np.float32)
        return vectors.astype(np.float32)

    # ------------------------------------------------------------------
    # Index management
    def upsert_metadata(self, records: Iterable[SymbolMetadataRecord], embed: bool = True) -> int:
        session: Session = self.session_factory()
        inserted = 0
        try:
            records = list(records)
            for record in records:
                metadata = session.get(TickerMetadata, record.symbol)
                if metadata is None:
                    metadata = TickerMetadata(symbol=record.symbol)
                metadata.name = record.name
                metadata.description = record.description
                metadata.exchange = record.exchange
                metadata.sector = record.sector
                metadata.aliases = list(record.aliases or [])
                session.add(metadata)
            session.commit()
            inserted = len(records)
        finally:
            session.close()

        if embed and inserted > 0:
            symbols = [r.symbol for r in records]
            self.embed_and_store(symbols)
        return inserted

    def embed_and_store(self, symbols: Sequence[str]) -> int:
        if not symbols:
            return 0
        session: Session = self.session_factory()
        try:
            rows = (
                session.query(TickerMetadata)
                .filter(TickerMetadata.symbol.in_(symbols))
                .all()
            )
            if not rows:
                return 0
            texts = [self._compose_embedding_text(row) for row in rows]
            vectors = self._embed(texts)
            for row, vector in zip(rows, vectors):
                embedding = session.get(TickerEmbedding, row.symbol)
                if embedding is None:
                    embedding = TickerEmbedding(symbol=row.symbol, model_name=self.model_name)
                embedding.model_name = self.model_name
                embedding.embedding = vector.tolist()
                session.add(embedding)
            session.commit()
            return len(rows)
        finally:
            session.close()

    def _compose_embedding_text(self, metadata: TickerMetadata) -> str:
        parts = [metadata.symbol or "", metadata.name or ""]
        if metadata.description:
            parts.append(metadata.description)
        if metadata.sector:
            parts.append(metadata.sector)
        if metadata.exchange:
            parts.append(metadata.exchange)
        if metadata.aliases:
            parts.extend(metadata.aliases)
        return " | ".join(part for part in parts if part)

    # ------------------------------------------------------------------
    # Query entry point
    def search(self, query: str, limit: int = 8) -> List[SymbolInfo]:
        query = (query or "").strip()
        if not query:
            return []

        try:
            query_vec = self._embed([query])[0]
        except Exception as exc:  # pragma: no cover - model load issues
            logger.error("Failed to embed query '%s': %s", query, exc)
            return []
        query_norm = float(np.linalg.norm(query_vec))
        if query_norm == 0:
            return []

        session: Session = self.session_factory()
        try:
            rows = (
                session.query(TickerEmbedding, TickerMetadata)
                .join(TickerMetadata, TickerMetadata.symbol == TickerEmbedding.symbol)
                .filter(TickerEmbedding.model_name == self.model_name)
                .all()
            )
            if not rows:
                return []

            results: List[SymbolInfo] = []
            for embedding_row, metadata_row in rows:
                vector = np.asarray(embedding_row.embedding, dtype=np.float32)
                if vector.size == 0:
                    continue
                denom = query_norm * float(np.linalg.norm(vector))
                if denom == 0:
                    continue
                score = float(np.dot(query_vec, vector) / denom)
                if np.isnan(score):
                    continue
                if score < self.min_score:
                    continue
                results.append(
                    SymbolInfo(
                        symbol=metadata_row.symbol,
                        name=metadata_row.name,
                        exchange=metadata_row.exchange,
                        sector=metadata_row.sector,
                        score=score,
                    )
                )

            results.sort(key=lambda item: item.score or 0, reverse=True)
            return results[:limit]
        finally:
            session.close()

    def closest_match(self, query: str) -> Optional[str]:
        """Return best matching ticker symbol for a free-form query."""
        matches = self.search(query, limit=1)
        if not matches:
            return None
        best = matches[0].symbol
        return best.upper() if best else None

    def symbol_exists(self, symbol: str) -> bool:
        """Check if an exact symbol is present in the metadata store."""
        sym = (symbol or "").strip().upper()
        if not sym:
            return False
        session: Session = self.session_factory()
        try:
            return session.get(TickerMetadata, sym) is not None
        finally:
            session.close()
