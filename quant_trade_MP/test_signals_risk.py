import asyncio
from types import SimpleNamespace

import pytest

from app.api.routes import signals
from app.models.schemas import GenerateRebalanceRequest
from app.models.database import SessionLocal


def _make_request(**overrides):
    params = {
        "target_weights": {"AAPL": 0.6, "MSFT": 0.4},
        "current_qty": {"AAPL": 0, "MSFT": 0},
        "prices": {"AAPL": 100.0, "MSFT": 100.0},
        "cash": 0.0,
        "capital": 100_000.0,
        "current_equity": 80_000.0,
        "peak_equity": 100_000.0,
    }
    params.update(overrides)
    return GenerateRebalanceRequest(
        target_weights=params["target_weights"],
        current_qty=params["current_qty"],
        prices=params["prices"],
        cash=params["cash"],
        capital=params["capital"],
        current_equity=params["current_equity"],
        peak_equity=params["peak_equity"],
    )


def test_rebalance_rejects_when_drawdown_exceeds_limit(monkeypatch):
    fake_user = SimpleNamespace(
        id=1,
        name="Risk Test",
        email="risk@test",
        drawdown_limit=0.10,
        max_position_size=0.20,
        capital=100_000.0,
    )

    monkeypatch.setattr(signals, "resolve_risk_profile", lambda db, capital_hint=None: (fake_user, signals.RiskConfig()))

    request = _make_request()
    with SessionLocal() as session:
        response = asyncio.run(signals.generate_rebalance_trades(request, db=session))

    assert response.success is False
    assert response.data is not None
    assert "drawdown" in (response.message or "").lower()
    assert response.data["risk_context"]["current_equity"] == pytest.approx(80_000.0)


def test_rebalance_allows_when_within_limit(monkeypatch):
    safe_user = SimpleNamespace(
        id=2,
        name="Risk Test",
        email="risk@test",
        drawdown_limit=0.30,
        max_position_size=0.20,
        capital=100_000.0,
    )

    monkeypatch.setattr(
        signals,
        "resolve_risk_profile",
        lambda db, capital_hint=None: (safe_user, signals.RiskConfig(max_position_fraction=0.60)),
    )

    request = _make_request(current_equity=95_000.0)
    with SessionLocal() as session:
        response = asyncio.run(signals.generate_rebalance_trades(request, db=session))

    assert response.success is True
    assert response.data is not None
    assert response.data["risk"]["drawdown_limit"] == pytest.approx(0.30)