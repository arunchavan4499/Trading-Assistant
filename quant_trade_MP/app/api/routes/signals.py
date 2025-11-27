"""Trade signal generation endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional, Dict
from datetime import datetime
import logging

try:
    from app.services.trade_signal_engine import TradeSignalEngine
    from app.services.risk_manager import RiskManager, RiskConfig
    from app.services.risk_helpers import resolve_risk_profile
    _trade_signal_engine_available = True
    _risk_manager_available = True
except Exception:
    TradeSignalEngine = None
    RiskManager = None
    RiskConfig = None
    resolve_risk_profile = None
    _trade_signal_engine_available = False
    _risk_manager_available = False
from app.dependencies.db import get_db
from app.models.database import User as UserModel
from app.models.schemas import (
    GenerateRebalanceRequest,
    RebalancePlan,
    GenerateSimpleSignalRequest,
    SimpleSignal,
    PortfolioValueRequest,
    PortfolioValueResponse,
    ApiResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/signals", tags=["signals"])


def _compute_equity_context(request: GenerateRebalanceRequest) -> Dict[str, float]:
    """Infer current, peak and capital values when not provided by the client."""
    holdings_value = 0.0
    for symbol, qty in (request.current_qty or {}).items():
        price = request.prices.get(symbol)
        if price is None:
            continue
        holdings_value += float(qty) * float(price)

    cash = float(request.cash or 0.0)
    inferred_equity = holdings_value + cash

    current_equity = float(request.current_equity) if request.current_equity is not None else inferred_equity
    capital = float(request.capital) if request.capital is not None else inferred_equity
    peak_equity = float(request.peak_equity) if request.peak_equity is not None else max(capital, current_equity)

    return {
        "current_equity": current_equity,
        "peak_equity": peak_equity,
        "capital": capital,
    }


@router.post("/rebalance", response_model=ApiResponse)
async def generate_rebalance_trades(request: GenerateRebalanceRequest, db: Session = Depends(get_db)):
    """
    Generate rebalance trade plan from target weights.
    
    Calculates the trades needed to move from current positions to target weights.
    
    - **target_weights**: Target portfolio weights
    - **current_qty**: Current quantities held for each symbol
    - **prices**: Current market prices for each symbol
    - **cash**: Available cash (optional)
    - **capital**: Total portfolio capital (optional)
    - **current_equity**: Current portfolio equity for drawdown check (optional)
    - **peak_equity**: Peak equity to date for drawdown check (optional)
    """
    try:
        logger.info("Generating rebalance trades")

        if not _trade_signal_engine_available or TradeSignalEngine is None:
            raise HTTPException(status_code=503, detail="TradeSignalEngine service unavailable (missing dependencies)")

        if not _risk_manager_available or RiskManager is None or resolve_risk_profile is None:
            raise HTTPException(status_code=503, detail="RiskManager service unavailable (missing dependencies)")

        equity_ctx = _compute_equity_context(request)
        user, risk_cfg = resolve_risk_profile(db, capital_hint=equity_ctx["capital"])
        risk_manager = RiskManager(user, risk_cfg)

        validation = risk_manager.validate_signal(
            signal_or_weights={"portfolio": request.target_weights},
            current_equity=equity_ctx["current_equity"],
            peak_equity=equity_ctx["peak_equity"],
            capital=equity_ctx["capital"],
        )

        if not validation.get("approved", False):
            reason = validation.get("reason", "Portfolio violates risk limits")
            return ApiResponse(
                success=False,
                data={
                    "violations": [reason],
                    "adjusted_portfolio": (validation.get("adjusted_signal") or {}).get("portfolio", {}),
                    "risk_context": equity_ctx,
                },
                message=reason,
                timestamp=datetime.utcnow().isoformat(),
            )

        adjusted_weights = (validation.get("adjusted_signal") or {}).get("portfolio") or request.target_weights

        signal_engine = TradeSignalEngine()

        # Generate rebalance plan
        plan = signal_engine.generate_portfolio_rebalance(
            target_weights=adjusted_weights,
            current_qty=request.current_qty,
            prices=request.prices,
            cash=request.cash,
            capital=request.capital,
            prefer_notional=True,
        )
        
        if not plan:
            raise HTTPException(status_code=400, detail="Failed to generate rebalance plan")
        
        # Format response
        trades = {}
        for symbol, trade_info in plan.get("trades", {}).items():
            trades[symbol] = {
                "symbol": symbol,
                "side": trade_info.get("side", "HOLD"),
                "quantity": trade_info.get("quantity", 0),
                "price": request.prices.get(symbol, 0),
                "notional": trade_info.get("notional", 0),
                "target_notional": trade_info.get("target_notional", 0),
                "current_notional": trade_info.get("current_notional", 0),
                "notional_diff": trade_info.get("notional_diff", 0),
                "deviation": trade_info.get("deviation", 0),
            }
        
        response_data = {
            "trades": trades,
            "summary": plan.get("summary", {}),
            "execution_order": list(trades.keys()),
            "risk": {
                "current_equity": equity_ctx["current_equity"],
                "peak_equity": equity_ctx["peak_equity"],
                "drawdown_limit": getattr(user, "drawdown_limit", 0.25),
                "reason": validation.get("reason"),
            },
        }
        
        return ApiResponse(
            success=True,
            data=response_data,
            message="Rebalance plan generated",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating rebalance trades: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating rebalance trades: {str(e)}")


@router.post("/simple", response_model=ApiResponse)
async def generate_simple_signal(request: GenerateSimpleSignalRequest):
    """
    Generate simple buy/sell/hold signal based on current vs target portfolio value.
    
    - **current_value**: Current portfolio value
    - **target_value**: Target portfolio value
    - **portfolio**: Current portfolio weights
    - **deviation_threshold**: Threshold for deviation (default 0.02 = 2%)
    """
    try:
        logger.info("Generating simple signal")

        if not _trade_signal_engine_available or TradeSignalEngine is None:
            raise HTTPException(status_code=503, detail="TradeSignalEngine service unavailable (missing dependencies)")

        signal_engine = TradeSignalEngine()

        # Generate signal
        signal = signal_engine.generate_signal(
            current_value=request.current_value,
            target_value=request.target_value,
            portfolio=request.portfolio,
        )
        
        if not signal:
            raise HTTPException(status_code=400, detail="Failed to generate signal")
        
        response_data = {
            "signal": signal.get("signal", "HOLD"),
            "deviation": signal.get("deviation", 0),
            "current_value": signal.get("current_value", request.current_value),
            "target_value": signal.get("target_value", request.target_value),
            "message": signal.get("message", ""),
            "portfolio": signal.get("portfolio", request.portfolio),
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        return ApiResponse(
            success=True,
            data=response_data,
            message="Signal generated",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error generating signal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating signal: {str(e)}")


@router.post("/portfolio-value", response_model=ApiResponse)
async def calculate_portfolio_value(request: PortfolioValueRequest):
    """
    Calculate total portfolio value from weights and prices.
    
    - **portfolio**: Portfolio weights for each asset
    - **prices**: Current prices for each asset
    """
    try:
        logger.info("Calculating portfolio value")

        if not _trade_signal_engine_available or TradeSignalEngine is None:
            raise HTTPException(status_code=503, detail="TradeSignalEngine service unavailable (missing dependencies)")

        signal_engine = TradeSignalEngine()

        # Calculate portfolio value
        value = signal_engine.calculate_portfolio_value(
            portfolio=request.portfolio,
            current_prices=request.prices,
        )
        
        response_data = {
            "value": value,
            "portfolio": request.portfolio,
            "prices": request.prices,
        }
        
        return ApiResponse(
            success=True,
            data=response_data,
            message="Portfolio value calculated",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error calculating portfolio value: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating portfolio value: {str(e)}")


@router.get("/{portfolio_run_id}/latest", response_model=ApiResponse)
async def get_latest_signal(portfolio_run_id: int):
    """
    Get latest signal for a specific portfolio run.
    
    - **portfolio_run_id**: Portfolio run ID
    """
    try:
        logger.info(f"Fetching latest signal for portfolio run {portfolio_run_id}")
        
        # For now, return 404
        # In production, query database for latest signal for this portfolio run
        raise HTTPException(status_code=404, detail=f"No signal found for portfolio run {portfolio_run_id}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching latest signal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching latest signal: {str(e)}")
