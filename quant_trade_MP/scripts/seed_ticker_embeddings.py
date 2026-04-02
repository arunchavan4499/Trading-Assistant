#!/usr/bin/env python
"""Seed ticker metadata + MiniLM embeddings from a CSV file."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import List

from app.services.semantic_search import SemanticSymbolSearchService, SymbolMetadataRecord


def parse_aliases(value: str | None) -> List[str]:
    if not value:
        return []
    return [alias.strip() for alias in value.replace('|', ';').split(';') if alias.strip()]


def load_records(csv_path: Path) -> List[SymbolMetadataRecord]:
    records: List[SymbolMetadataRecord] = []
    with csv_path.open(newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        required_cols = {"symbol", "name"}
        missing = required_cols - set(col.strip() for col in reader.fieldnames or [])
        if missing:
            raise ValueError(f"CSV is missing required columns: {missing}")
        for row in reader:
            symbol = (row.get("symbol") or "").strip().upper()
            name = (row.get("name") or "").strip()
            if not symbol or not name:
                continue
            records.append(
                SymbolMetadataRecord(
                    symbol=symbol,
                    name=name,
                    description=(row.get("description") or "").strip() or None,
                    exchange=(row.get("exchange") or "").strip() or None,
                    sector=(row.get("sector") or "").strip() or None,
                    aliases=parse_aliases(row.get("aliases")),
                )
            )
    return records


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--csv",
        type=Path,
        default=Path("data/reference/tickers_sample.csv"),
        help="Path to CSV containing symbol metadata.",
    )
    parser.add_argument(
        "--no-embed",
        action="store_true",
        help="Skip embedding pass (metadata only).",
    )
    args = parser.parse_args()

    csv_path = args.csv
    if not csv_path.exists():
        raise SystemExit(f"CSV not found: {csv_path}")

    records = load_records(csv_path)
    if not records:
        raise SystemExit("No valid records found in CSV")

    service = SemanticSymbolSearchService()
    inserted = service.upsert_metadata(records, embed=not args.no_embed)
    print(f"Upserted metadata for {inserted} tickers from {csv_path}.")

    if not args.no_embed:
        print("Embeddings stored via pgvector. Semantic search ready!")
    else:
        print("Metadata stored. Run again without --no-embed to generate embeddings.")


if __name__ == "__main__":
    main()
