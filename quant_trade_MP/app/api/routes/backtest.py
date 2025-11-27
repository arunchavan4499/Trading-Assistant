"""Backtesting endpoints."""

from datetime import datetime, date
import logging
import pandas as pd
import numpy as np
from typing import Optional, Dict, List, Any

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
try:
    from app.services.backtester import Backtester
    _backtester_available = True
except Exception:
    Backtester = None
    _backtester_available = False

try:
    from app.services.data_fetcher import DataFetcher
    _data_fetcher_available = True
except Exception:
    DataFetcher = None
    _data_fetcher_available = False
try:
    from app.services.risk_manager import RiskManager
    from app.services.risk_helpers import resolve_risk_profile
    _risk_manager_available = True
except Exception:
    RiskManager = None
    resolve_risk_profile = None
    _risk_manager_available = False
from app.dependencies.db import get_db
from app.models.database import BacktestRun as BacktestRunModel
from app.models.schemas import (
    BacktestConfig,
    BacktestResultResponse,
    BacktestRun,
    BacktestMetrics,
    EquityPoint,
    TradeRecord,
    ApiResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/backtest", tags=["backtest"])


def _serialize_backtest_run(run: BacktestRunModel) -> Dict[str, Any]:
    """Serialize backtest run with metric key aliases for frontend compatibility."""
    metrics = run.metrics or {}
    
    # Add aliases for frontend compatibility (ann_return, ann_vol)
    # These map to annual_return and annual_vol from the performance evaluator
    if isinstance(metrics, dict):
        if 'annual_return' in metrics and 'ann_return' not in metrics:
            metrics['ann_return'] = metrics['annual_return']
        if 'annual_vol' in metrics and 'ann_vol' not in metrics:
            metrics['ann_vol'] = metrics['annual_vol']
    
    return {
        "id": run.id,
        "run_name": run.run_name,
        "symbols": run.symbols or [],
        "config": run.config or {},
        "metrics": metrics,
        "equity_curve": run.equity_curve or [],
        "trades": run.trades or [],
        "created_at": run.created_at.isoformat() if run.created_at else None,
    }


def _format_index_date(value: Any) -> str:
    try:
        if hasattr(value, "to_pydatetime"):
            candidate = value.to_pydatetime()
            if isinstance(candidate, (datetime, date)):
                return candidate.strftime("%Y-%m-%d")
        if isinstance(value, (datetime, date)):
            return value.strftime("%Y-%m-%d")
    except Exception:
        pass
    return str(value)


@router.post("/run", response_model=ApiResponse)
async def run_backtest(request: BacktestConfig, db: Session = Depends(get_db)):
    """
    Run backtest simulation with given configuration.
    
    Simulates portfolio performance over historical period with specified weights.
    
    - **symbols**: List of ticker symbols
    - **start_date**: Backtest start date
    - **end_date**: Backtest end date
    - **weights**: Portfolio weights for each symbol
    - **initial_capital**: Starting capital (default 100,000)
    - **commission_rate**: Transaction commission as decimal (default 0.0005)
    - **slippage_pct**: Slippage as decimal (default 0.0005)
    - **rebalance_freq_days**: Rebalancing frequency in days (default 7)
    - **run_name**: Optional name for this backtest run
    """
    try:
        logger.info(f"Running backtest: {request.symbols} from {request.start_date} to {request.end_date}")

        def _is_placeholder(value: Optional[str]) -> bool:
            if value is None:
                return True
            trimmed = value.strip().lower()
            return trimmed in {"", "string", "null", "undefined"}

        cleaned_symbols = [sym.strip().upper() for sym in request.symbols if isinstance(sym, str) and not _is_placeholder(sym)]
        if not cleaned_symbols:
            raise HTTPException(status_code=400, detail="Please provide at least one valid ticker symbol.")

        if _is_placeholder(request.start_date) or _is_placeholder(request.end_date):
            raise HTTPException(status_code=400, detail="Please provide valid start and end dates for the backtest.")

        if not request.weights:
            raise HTTPException(status_code=400, detail="Backtest weights are required for each symbol.")
        
        # Create instances locally (check availability)
        if not _data_fetcher_available or DataFetcher is None:
            raise HTTPException(status_code=503, detail="DataFetcher service unavailable (missing dependencies)")
        if not _backtester_available or Backtester is None:
            raise HTTPException(status_code=503, detail="Backtester service unavailable (missing dependencies)")

        data_fetcher = DataFetcher()
        backtester = Backtester()
        
        # Validate and convert date inputs
        try:
            start_dt = pd.to_datetime(request.start_date, errors="raise")
            end_dt = pd.to_datetime(request.end_date, errors="raise")
        except Exception:
            logger.warning("Invalid start/end date formats: %s - %s", request.start_date, request.end_date)
            raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD or ISO date string.")

        # Fetch market data for backtest period
        market_data = data_fetcher.fetch_ohlcv(
            symbols=cleaned_symbols,
            start=start_dt,
            end=end_dt,
            save_to_db=False
        )

        # Validate that each requested symbol returned usable data and has a datetime index
        for sym in cleaned_symbols:
            df = market_data.get(sym)
            if df is None or df.empty:
                logger.warning("No market data for symbol: %s", sym)
                raise HTTPException(status_code=400, detail=f"Failed to fetch market data for symbol: {sym}")
            try:
                df.index = pd.to_datetime(df.index, errors="raise")
            except Exception as e:
                logger.error("Invalid index for symbol %s: %s", sym, e)
                raise HTTPException(status_code=400, detail=f"Invalid data index for symbol: {sym}")
        
        # Convert weights from dict to expected format
        weights_dict = {symbol: request.weights.get(symbol, 0.0) for symbol in cleaned_symbols}
        
        # Run simulation (catch validation errors coming from the backtester)
        risk_mgr = None
        if _risk_manager_available and RiskManager is not None and resolve_risk_profile is not None:
            user, risk_cfg = resolve_risk_profile(db, capital_hint=request.initial_capital)
            risk_mgr = RiskManager(user, risk_cfg)

        try:
            equity_df, trades_df = backtester.simulate(
                weights=weights_dict,
                price_data=market_data,
                risk_mgr=risk_mgr,
                rebalance_dates=None,
                initial_cash=request.initial_capital,
            )
        except ValueError as ve:
            logger.error("Backtester validation error: %s", ve)
            raise HTTPException(status_code=400, detail=str(ve))
        
        if equity_df is None or trades_df is None:
            raise HTTPException(status_code=500, detail="Backtest simulation failed")
        
        # Compute performance metrics
        from app.services.performance_evaluator import PerformanceEvaluator
        evaluator = PerformanceEvaluator()
        
        metrics_dict = evaluator.summary_metrics(equity_df[["equity"]], risk_free_rate=0.02)
        
        # Format equity curve
        equity_curve = []
        for idx, row in equity_df.iterrows():
            date_str = _format_index_date(idx)
            equity_curve.append(
                EquityPoint(
                    date=date_str,
                    equity=float(row.get("equity", 0)),
                    cash=float(row.get("cash", 0)),
                    positions_value=float(row.get("positions_value", 0)),
                )
            )
        
        # Format trades (use the 'date' column from each trade row to avoid integer index issues)
        trades = []
        for _, row in trades_df.iterrows():
            trade_date_val = row.get("date")
            trade_date = _format_index_date(trade_date_val)
            trades.append(
                TradeRecord(
                    date=trade_date,
                    symbol=row.get("symbol", ""),
                    side=row.get("side", ""),
                    quantity=float(row.get("quantity", 0)),
                    price=float(row.get("price", 0)),
                    notional=float(row.get("notional", 0)),
                    fees_and_slippage=float(row.get("fees_and_slippage", 0)),
                )
            )
        
        # Create metrics
        # Handle both annual_return/annual_vol (backend keys) and fallback for NaN values
        annual_ret = metrics_dict.get("annual_return", 0)
        annual_vol = metrics_dict.get("annual_vol", 0)
        
        # Convert NaN to 0 for JSON serialization
        if isinstance(annual_ret, float) and np.isnan(annual_ret):
            annual_ret = 0.0
        if isinstance(annual_vol, float) and np.isnan(annual_vol):
            annual_vol = 0.0
            
        backtest_metrics = BacktestMetrics(
            sharpe=metrics_dict.get("sharpe", 0),
            sortino=metrics_dict.get("sortino", 0),
            max_drawdown=metrics_dict.get("max_drawdown", 0),
            annual_return=float(annual_ret),
            annual_vol=float(annual_vol),
            n_periods=metrics_dict.get("n_periods", 0),
            total_return=0.0,
            num_trades=len(trades),
            winning_trades=0,
            losing_trades=0,
            avg_win=0.0,
            avg_loss=0.0,
        )
        
        run_record = BacktestRunModel(
            run_name=request.run_name or f"backtest-{datetime.utcnow().isoformat()}",
            symbols=request.symbols,
            config=request.dict(),
            metrics=backtest_metrics.dict(),
            equity_curve=[ec.dict() for ec in equity_curve],
            trades=[t.dict() for t in trades],
        )
        db.add(run_record)
        db.commit()
        db.refresh(run_record)

        risk_flags = {}
        if getattr(backtester, "last_drawdown_breach", None):
            breach = backtester.last_drawdown_breach
            risk_flags["drawdown_breach"] = {
                "message": breach.get("message"),
                "date": str(breach.get("date")),
                "drawdown": breach.get("drawdown"),
                "limit": breach.get("limit"),
                "current_equity": breach.get("current_equity"),
                "peak_equity": breach.get("peak_equity"),
            }

        response_data = {
            "run_id": run_record.id,
            "config": run_record.config,
            "metrics": run_record.metrics,
            "equity_curve": run_record.equity_curve,
            "trades": run_record.trades,
            "created_at": run_record.created_at.isoformat(),
        }
        if risk_flags:
            response_data["risk"] = risk_flags
        
        return ApiResponse(
            success=True,
            data=response_data,
            message="Backtest completed successfully" if not risk_flags else "Backtest completed with risk warnings",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error running backtest: {str(e)}")
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Error running backtest: {str(e)}")


@router.get("/runs", response_model=ApiResponse)
async def get_backtest_runs(db: Session = Depends(get_db)):
    """List recent backtest runs."""
    try:
        logger.info("Fetching backtest runs")
        runs = (
            db.query(BacktestRunModel)
            .order_by(BacktestRunModel.created_at.desc())
            .limit(50)
            .all()
        )
        data = [_serialize_backtest_run(run) for run in runs]
        return ApiResponse(
            success=True,
            data={"runs": data},
            message=f"Retrieved {len(data)} backtest runs",
            timestamp=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        logger.exception("Error fetching backtest runs")
        raise HTTPException(status_code=500, detail=f"Error fetching backtest runs: {str(e)}")


@router.get("/results/{backtest_id}", response_model=ApiResponse)
async def get_backtest_result(backtest_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    """Fetch a single backtest run."""
    try:
        logger.info(f"Fetching backtest result {backtest_id}")
        run = db.query(BacktestRunModel).filter(BacktestRunModel.id == backtest_id).first()
        if not run:
            raise HTTPException(status_code=404, detail=f"Backtest {backtest_id} not found")
        return ApiResponse(
            success=True,
            data=_serialize_backtest_run(run),
            message="Backtest run retrieved",
            timestamp=datetime.utcnow().isoformat(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching backtest result")
        raise HTTPException(status_code=500, detail=f"Error fetching backtest result: {str(e)}")


@router.get("/status/{job_id}", response_model=ApiResponse)
async def get_backtest_status(job_id: str):
    """
    Get status of a backtest job (for future async implementation).
    
    - **job_id**: Job ID from async backtest submission
    """
    try:
        logger.info(f"Fetching backtest status for job {job_id}")
        
        # For now, return 404
        # In production, query job queue (Celery/RQ) for job status
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching backtest status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching backtest status: {str(e)}")


@router.get("/download/{backtest_id}", response_model=ApiResponse)
async def download_backtest_report(backtest_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    """Return a serialized backtest report payload (JSON) for now."""
    try:
        logger.info(f"Downloading backtest report {backtest_id}")
        run = db.query(BacktestRunModel).filter(BacktestRunModel.id == backtest_id).first()
        if not run:
            raise HTTPException(status_code=404, detail=f"Backtest {backtest_id} not found")
        return ApiResponse(
            success=True,
            data=_serialize_backtest_run(run),
            message="Backtest report ready",
            timestamp=datetime.utcnow().isoformat(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error downloading backtest report")
        raise HTTPException(status_code=500, detail=f"Error downloading backtest report: {str(e)}")
