"""Shared helpers for resolving risk configuration and user context."""
from __future__ import annotations
from types import SimpleNamespace
from typing import Optional, Tuple, Any

from sqlalchemy.orm import Session

from app.models.database import User as UserModel
from app.services.risk_manager import RiskConfig

DEFAULT_DRAWDOWN_LIMIT = 0.25
DEFAULT_MAX_POSITION = 0.20


def resolve_risk_profile(
    db: Optional[Session],
    *,
    capital_hint: Optional[float] = None,
) -> Tuple[Any, RiskConfig]:
    """Return the active user (or a safe default) plus a RiskConfig."""
    user = None
    if db is not None:
        try:
            user = (
                db.query(UserModel)
                .order_by(UserModel.id)
                .first()
            )
        except Exception:
            user = None

    if user is None:
        user = SimpleNamespace(
            id=None,
            name="Default Risk User",
            email="risk@local",
            drawdown_limit=DEFAULT_DRAWDOWN_LIMIT,
            max_position_size=DEFAULT_MAX_POSITION,
            capital=capital_hint,
        )

    max_pos = getattr(user, "max_position_size", None)
    cfg = RiskConfig(
        max_position_fraction=float(max_pos)
        if isinstance(max_pos, (int, float)) and max_pos > 0
        else DEFAULT_MAX_POSITION,
        max_portfolio_exposure=1.0,
        min_cash_buffer=0.0,
        use_half_kelly=True,
    )
    return user, cfg
