"""Shared FastAPI dependencies for database sessions."""

from collections.abc import Generator
from sqlalchemy.orm import Session

from app.models.database import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Yield a SQLAlchemy session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
