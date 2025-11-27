"""Risk management endpoints."""

from datetime import datetime
import logging
from typing import Optional, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

try:
    from app.services.risk_manager import RiskManager, RiskConfig
    _risk_manager_available = True
except Exception:
    RiskManager = None
    RiskConfig = None
    _risk_manager_available = False
from app.dependencies.db import get_db
from app.models.database import PortfolioRun as PortfolioRunModel, BacktestRun as BacktestRunModel, User as UserModel
from app.models.schemas import (
    RiskValidationRequest,
    RiskStatus,
    RiskLimits,
    DrawdownRecord,
    ApiResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/risk", tags=["risk"])


@router.post("/validate", response_model=ApiResponse)
async def validate_risk(request: RiskValidationRequest, db: Session = Depends(get_db)):
    """
    Validate portfolio against risk limits.
    
    Checks if proposed portfolio weights comply with risk management rules.
    
    - **weights**: Portfolio weights to validate
    - **current_equity**: Current portfolio equity value
    - **peak_equity**: Peak portfolio equity value (for drawdown calculation)
    - **limits**: Risk limits to apply (optional; uses defaults if not provided)
    """
    try:
        logger.info("Validating risk for portfolio")
        
        # Get user for RiskManager
        user = db.query(UserModel).first()
        if not user:
            user = UserModel(drawdown_limit=0.25, max_position_size=0.20)
        
        # ✅ Use RiskManager for consistent validation
        config = RiskConfig()
        if request.limits:
            config.max_position_fraction = request.limits.max_position_fraction or 0.20
            config.max_portfolio_exposure = request.limits.max_portfolio_exposure or 1.0
            config.min_cash_buffer = request.limits.min_cash_buffer or 0.0
        
        rm = RiskManager(user, config)
        
        # Use RiskManager's validate_signal method
        validation_result = rm.validate_signal(
            signal_or_weights={'portfolio': request.weights},
            current_equity=request.current_equity,
            peak_equity=request.peak_equity,
            capital=request.current_equity
        )
        
        violations = []
        is_safe = validation_result['approved']
        
        # Also get drawdown info
        dd_ok, dd_msg = rm.check_drawdown(request.current_equity, request.peak_equity)
        drawdown = (request.peak_equity - request.current_equity) / request.peak_equity if request.peak_equity > 0 else 0
        max_dd = request.limits.max_drawdown if request.limits else user.drawdown_limit or 0.25
        
        if not dd_ok:
            violations.append(dd_msg)
        
        # Build response
        response_data = {
            "is_safe": is_safe,
            "current_drawdown": drawdown,
            "max_drawdown_limit": max_dd,
            "drawdown_warning": drawdown > max_dd,
            "violations": violations if violations else ([] if is_safe else ["Portfolio violates risk limits"]),
            "message": validation_result.get('reason', 'Portfolio is safe' if is_safe else 'Portfolio violates risk limits'),
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        return ApiResponse(
            success=True,
            data=response_data,
            message="Risk validation completed",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error validating risk: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error validating risk: {str(e)}")


@router.get("/status", response_model=ApiResponse)
async def get_risk_status(db: Session = Depends(get_db)):
    """
    Get current portfolio risk status.
    
    Returns current drawdown, exposure, and risk warnings.
    """
    try:
        logger.info("Fetching risk status")

        latest_portfolio = (
            db.query(PortfolioRunModel)
            .order_by(PortfolioRunModel.created_at.desc())
            .first()
        )

        if not latest_portfolio:
            return ApiResponse(
                success=True,
                data=None,
                message="No portfolio records available to compute risk status",
                timestamp=datetime.utcnow().isoformat(),
            )

        assets = latest_portfolio.weights_json or {}
        max_position = max((abs(weight) for weight in assets.values()), default=0.0)
        total_exposure = sum(abs(weight) for weight in assets.values())

        # Calculate current drawdown from portfolio equity tracking
        drawdown_observed = 0.0
        
        # First try: use portfolio's current_equity and peak_equity columns
        if (latest_portfolio.current_equity and latest_portfolio.peak_equity and 
            latest_portfolio.peak_equity > 0):
            drawdown_observed = (latest_portfolio.peak_equity - latest_portfolio.current_equity) / latest_portfolio.peak_equity
        else:
            # Fallback: fetch from latest backtest metrics
            latest_backtest = (
                db.query(BacktestRunModel)
                .order_by(BacktestRunModel.created_at.desc())
                .first()
            )
            
            if latest_backtest:
                metrics = latest_backtest.metrics or {}
                if isinstance(metrics, dict):
                    drawdown_observed = metrics.get("max_drawdown") or metrics.get("drawdown") or 0.0

        # Fetch user's drawdown limit
        max_drawdown_limit = 0.20
        user = db.query(UserModel).order_by(UserModel.id).first()
        if user and user.drawdown_limit is not None:
            max_drawdown_limit = user.drawdown_limit
        
        # Also check portfolio metrics for override
        portfolio_metrics = latest_portfolio.metrics or {}
        if isinstance(portfolio_metrics, dict) and portfolio_metrics.get("max_drawdown_limit"):
            max_drawdown_limit = portfolio_metrics["max_drawdown_limit"]

        violations = []
        if drawdown_observed > max_drawdown_limit:
            violations.append(
                f"Observed drawdown {drawdown_observed:.2%} exceeds limit {max_drawdown_limit:.2%}"
            )
        if max_position > 0.20:
            violations.append(f"Max position {max_position:.2%} exceeds 20% threshold")
        if total_exposure > 1.0:
            violations.append(f"Total exposure {total_exposure:.2%} exceeds 100%")

        is_safe = len(violations) == 0

        # Build position_limits from assets
        position_limits = {}
        for symbol, weight in assets.items():
            position_limits[symbol] = {
                "current": abs(weight),
                "max": 0.30
            }

        response_data = {
            "is_safe": is_safe,
            "current_drawdown": drawdown_observed,
            "drawdown_limit": max_drawdown_limit,
            "max_drawdown_limit": max_drawdown_limit,
            "drawdown_warning": drawdown_observed > max_drawdown_limit,
            "violations": violations,
            "message": "Portfolio is safe" if is_safe else "Risk limits breached",
            "timestamp": datetime.utcnow().isoformat(),
            "portfolio_id": latest_portfolio.id,
            "max_position": max_position,
            "total_exposure": total_exposure,
            "position_limits": position_limits,
            "position_sizes": assets,
        }

        return ApiResponse(
            success=True,
            data=response_data,
            message="Risk status retrieved",
            timestamp=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        logger.exception("Error fetching risk status")
        raise HTTPException(status_code=500, detail=f"Error fetching risk status: {str(e)}")


@router.get("/limits", response_model=ApiResponse)
async def get_risk_limits(db: Session = Depends(get_db)):
    """
    Get current risk limit configuration.
    Fetches limits from the user profile and system defaults.
    """
    try:
        logger.info("Fetching risk limits")
        
        # Get the default user
        user = (
            db.query(UserModel)
            .order_by(UserModel.id)
            .first()
        )
        
        if not user:
            # Return defaults if no user exists
            limits = {
                "max_position_fraction": 0.20,
                "max_portfolio_exposure": 1.0,
                "min_cash_buffer": 0.0,
                "use_half_kelly": True,
                "max_drawdown": 0.20,
                "max_assets": 15,
            }
        else:
            # Return user-configured limits
            limits = {
                "max_position_fraction": 0.20,  # 20% max position
                "max_portfolio_exposure": 1.0,  # 100% max exposure
                "min_cash_buffer": 0.0,
                "use_half_kelly": True,
                "max_drawdown": user.drawdown_limit or 0.20,  # User's drawdown limit
                "max_assets": user.max_assets or 15,  # User's max assets setting
                "user_name": user.name,
                "user_email": user.email,
            }
        
        return ApiResponse(
            success=True,
            data={"limits": limits},
            message="Risk limits retrieved",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error fetching risk limits: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching risk limits: {str(e)}")


@router.put("/limits", response_model=ApiResponse)
async def update_risk_limits(limits: RiskLimits):
    """
    Update risk limit configuration.
    
    - **max_position_fraction**: Maximum position size as fraction of capital
    - **max_portfolio_exposure**: Maximum total portfolio exposure
    - **min_cash_buffer**: Minimum cash buffer to maintain
    - **use_half_kelly**: Whether to use half-Kelly fraction for sizing
    - **max_drawdown**: Maximum acceptable drawdown
    """
    try:
        logger.info(f"Updating risk limits: {limits}")
        
        # In production, save to database
        # For now, just return the updated limits
        
        return ApiResponse(
            success=True,
            data={"limits": limits.dict()},
            message="Risk limits updated",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error updating risk limits: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating risk limits: {str(e)}")


@router.get("/drawdown-history", response_model=ApiResponse)
async def get_drawdown_history(
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
):
    """
    Get historical drawdown data.
    
    - **start_date**: Optional start date filter
    - **end_date**: Optional end date filter
    """
    try:
        logger.info(f"Fetching drawdown history from {start_date} to {end_date}")
        
        # For now, return empty list
        # In production, query DrawdownRecord table from database
        history = []
        
        return ApiResponse(
            success=True,
            data={"history": history},
            message=f"Retrieved {len(history)} drawdown records",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error fetching drawdown history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching drawdown history: {str(e)}")
