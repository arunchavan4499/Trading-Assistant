"""Portfolio construction endpoints."""

from datetime import datetime
import logging
from typing import Optional, Dict, List, Any

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
import numpy as np
import pandas as pd

from app.services.symbol_resolver import resolve_symbols

try:
    from app.services.feature_engineer import FeatureEngineer
    _feature_engineer_available = True
except Exception:
    FeatureEngineer = None
    _feature_engineer_available = False

try:
    from app.services.portfolio_constructor import PCOptions, construct_portfolio_from_var_and_cov
    _portfolio_constructor_available = True
except Exception:
    PCOptions = None
    construct_portfolio_from_var_and_cov = None
    _portfolio_constructor_available = False
from app.dependencies.db import get_db
from app.models.database import PortfolioRun as PortfolioRunModel, VarRun as VarRunModel
from app.models.schemas import (
    ConstructPortfolioRequest,
    ConstructPortfolioResponse,
    PortfolioMetrics,
    CovarianceRequest,
    CovarianceResponse,
    RunVARRequest,
    RunVARResponse,
    PortfolioRun,
    VARRun,
    ApiResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/portfolio", tags=["portfolio"])


def _serialize_portfolio_run(run: PortfolioRunModel) -> Dict[str, Any]:
    return {
        "id": run.id,
        "run_name": run.run_name,
        "symbols": run.symbols or [],
        "weights": run.weights_json or {},
        "method": run.method,
        "metrics": run.metrics or {},
        "link_run_id": run.link_run_id,
        "current_equity": run.current_equity or 0.0,
        "peak_equity": run.peak_equity or 0.0,
        "created_at": run.created_at.isoformat() if run.created_at else None,
    }


def _serialize_var_run(run: VarRunModel) -> Dict[str, Any]:
    return {
        "id": run.id,
        "run_name": run.run_name,
        "symbols": run.symbols or [],
        "ridge_lambda": run.ridge_lambda,
        "a_matrix": run.a_matrix,
        "covariance_matrix": run.cov_matrix,
        "std_matrix": run.std_matrix,
        "diagnostics": run.diagnostics,
        "created_at": run.created_at.isoformat() if run.created_at else None,
    }


@router.post("/construct", response_model=ApiResponse)
async def construct_portfolio(request: ConstructPortfolioRequest, db: Session = Depends(get_db)):
    """
    Construct optimized portfolio from market data.
    
    Runs the full pipeline:
    1. Fetches OHLCV data
    2. Computes features and VAR matrices
    3. Optimizes portfolio weights
    
    - **symbols**: List of ticker symbols
    - **start_date**: Start date in YYYY-MM-DD format
    - **end_date**: End date in YYYY-MM-DD format
    - **ridge_lambda**: Regularization parameter for covariance estimation
    - **options**: Portfolio construction options
    """
    try:
        logger.info(f"Constructing portfolio for {request.symbols}")

        resolved_symbols, unresolved = await resolve_symbols(request.symbols)
        if unresolved:
            raise HTTPException(status_code=400, detail=f"Unable to resolve symbols: {', '.join(unresolved)}")
        if not resolved_symbols:
            raise HTTPException(status_code=400, detail="No valid symbols provided")
        
        # Step 1: Fetch market data
        from app.services.data_fetcher import DataFetcher
        data_fetcher = DataFetcher()
        market_data = data_fetcher.fetch_ohlcv(
            symbols=resolved_symbols,
            start=request.start_date,
            end=request.end_date,
            save_to_db=True
        )
        
        if not market_data:
            raise HTTPException(status_code=400, detail="Failed to fetch market data")
        
        # Step 2: Compute log returns and VAR matrices
        if not _feature_engineer_available or FeatureEngineer is None:
            raise HTTPException(status_code=503, detail="FeatureEngineer service unavailable (missing dependencies)")
        feature_engineer = FeatureEngineer()

        standardized, A, cov, diag = feature_engineer.pipeline_var_cov(
            data=market_data,
            ridge_lambda=request.ridge_lambda,
            auto_ridge=True,
            persist_outputs=False,
            save_db_record=False,
            run_name=request.options.run_name,
        )
        
        # Ensure portfolio constructor is available before building options
        if not _portfolio_constructor_available or construct_portfolio_from_var_and_cov is None:
            raise HTTPException(status_code=503, detail="Portfolio constructor service unavailable (missing dependencies)")

        # Step 3: Convert options to PCOptions
        pc_options = PCOptions(
            max_weight=request.options.max_weight,
            min_weight=request.options.min_weight,
            allow_short=request.options.allow_short,
            method=request.options.method,
            risk_aversion=request.options.risk_aversion,
            sparsity_k=request.options.sparsity_k,
            sparsity_keep_signed=request.options.sparsity_keep_signed,
            cov_ridge=request.options.cov_ridge,
            use_graphical_lasso=request.options.use_graphical_lasso,
            persist=request.options.persist,
            run_name=request.options.run_name,
            verbose=request.options.verbose,
        )
        
        # Step 4: Construct portfolio
        if not _portfolio_constructor_available or construct_portfolio_from_var_and_cov is None:
            raise HTTPException(status_code=503, detail="Portfolio constructor service unavailable (missing dependencies)")

        weights, metrics = construct_portfolio_from_var_and_cov(
            standardized=standardized,
            A=A,
            cov=cov,
            raw_returns=None,
            symbols=resolved_symbols,
            opts=pc_options,
            w_prev=None,
            link_run_id=None,
        )
        
        # Convert weights series to dict
        weights_dict = weights.to_dict() if hasattr(weights, 'to_dict') else dict(weights)
        
        # Create metrics response (ensure portfolio_std is preserved for UI volatility display)
        portfolio_std = metrics.get("portfolio_std")
        variance = metrics.get("variance")
        if variance is None and portfolio_std is not None:
            variance = float(portfolio_std) ** 2

        portfolio_metrics = PortfolioMetrics(
            expected_return=metrics.get("expected_return"),
            variance=variance,
            std_dev=metrics.get("std_dev") or portfolio_std,
            portfolio_std=portfolio_std,
            sharpe_ratio=metrics.get("sharpe_ratio"),
            sparsity=metrics.get("sparsity"),
            num_assets=int(metrics.get("n_assets") or len(resolved_symbols)),
        )
        
        run_record = PortfolioRunModel(
            run_name=request.options.run_name or f"portfolio-{datetime.utcnow().isoformat()}",
            symbols=resolved_symbols,
            weights_json=weights_dict,
            method=request.options.method,
            link_run_id=metrics.get("run_id"),
            metrics=portfolio_metrics.dict(),
            current_equity=100000.0,  # Initialize with default capital
            peak_equity=100000.0,     # Start at initial capital
        )
        db.add(run_record)
        db.commit()
        db.refresh(run_record)

        response_data = {
            "weights": weights_dict,
            "metrics": portfolio_metrics.dict(),
            "run_id": run_record.id,
            "method": request.options.method,
            "created_at": run_record.created_at.isoformat(),
        }
        
        return ApiResponse(
            success=True,
            data=response_data,
            message=f"Portfolio constructed for {len(resolved_symbols)} assets",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except ValueError as e:
        logger.error(f"ValueError constructing portfolio: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error constructing portfolio: {str(e)}")
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Error constructing portfolio: {str(e)}")


@router.post("/covariance", response_model=ApiResponse)
async def compute_covariance(request: CovarianceRequest):
    """
    Compute covariance matrix for symbols.
    
    - **symbols**: List of ticker symbols
    - **start_date**: Start date in YYYY-MM-DD format
    - **end_date**: End date in YYYY-MM-DD format
    - **ridge_lambda**: Regularization parameter
    """
    try:
        logger.info(f"Computing covariance for {request.symbols}")

        resolved_symbols, unresolved = await resolve_symbols(request.symbols)
        if unresolved:
            raise HTTPException(status_code=400, detail=f"Unable to resolve symbols: {', '.join(unresolved)}")
        if not resolved_symbols:
            raise HTTPException(status_code=400, detail="No valid symbols provided")
        
        # Fetch market data
        from app.services.data_fetcher import DataFetcher
        data_fetcher = DataFetcher()
        market_data = data_fetcher.fetch_ohlcv(
            symbols=resolved_symbols,
            start=request.start_date,
            end=request.end_date,
            save_to_db=False
        )
        
        if not market_data:
            raise HTTPException(status_code=400, detail="Failed to fetch market data")
        
        if not _feature_engineer_available or FeatureEngineer is None:
            raise HTTPException(status_code=503, detail="FeatureEngineer service unavailable (missing dependencies)")
        feature_engineer = FeatureEngineer()

        # Compute covariance through VAR pipeline
        standardized, A, cov, diag = feature_engineer.pipeline_var_cov(
            data=market_data,
            ridge_lambda=request.ridge_lambda,
            auto_ridge=True,
            persist_outputs=False,
            save_db_record=False,
        )
        
        # Convert numpy array to list of lists
        cov_list = cov.tolist()
        
        response_data = {
            "covariance_matrix": cov_list,
            "symbols": resolved_symbols,
            "ridge_lambda": request.ridge_lambda,
        }
        
        return ApiResponse(
            success=True,
            data=response_data,
            message="Covariance matrix computed",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except ValueError as e:
        logger.error(f"ValueError computing covariance: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error computing covariance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error computing covariance: {str(e)}")


@router.get("/runs", response_model=ApiResponse)
async def get_portfolio_runs(db: Session = Depends(get_db)):
    """Get list of recent portfolio runs from the database."""
    try:
        logger.info("Fetching portfolio runs")
        runs = (
            db.query(PortfolioRunModel)
            .order_by(PortfolioRunModel.created_at.desc())
            .limit(50)
            .all()
        )
        data = [_serialize_portfolio_run(run) for run in runs]
        return ApiResponse(
            success=True,
            data={"runs": data},
            message=f"Retrieved {len(data)} portfolio runs",
            timestamp=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        logger.exception("Error fetching portfolio runs")
        raise HTTPException(status_code=500, detail=f"Error fetching portfolio runs: {str(e)}")


@router.get("/runs/{run_id}", response_model=ApiResponse)
async def get_portfolio_run(run_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    """Get specific portfolio run details."""
    try:
        logger.info(f"Fetching portfolio run {run_id}")
        run = db.query(PortfolioRunModel).filter(PortfolioRunModel.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail=f"Portfolio run {run_id} not found")
        return ApiResponse(
            success=True,
            data=_serialize_portfolio_run(run),
            message="Portfolio run retrieved",
            timestamp=datetime.utcnow().isoformat(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching portfolio run")
        raise HTTPException(status_code=500, detail=f"Error fetching portfolio run: {str(e)}")


@router.delete("/runs/{run_id}", response_model=ApiResponse)
async def delete_portfolio_run(run_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    """Delete a portfolio run by ID."""
    try:
        logger.info(f"Deleting portfolio run {run_id}")
        run = db.query(PortfolioRunModel).filter(PortfolioRunModel.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail=f"Portfolio run {run_id} not found")
        db.delete(run)
        db.commit()
        return ApiResponse(
            success=True,
            data={"deleted_run_id": run_id},
            message="Portfolio run deleted",
            timestamp=datetime.utcnow().isoformat(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error deleting portfolio run")
        raise HTTPException(status_code=500, detail=f"Error deleting portfolio run: {str(e)}")


@router.post("/var/run", response_model=ApiResponse)
async def run_var_pipeline(request: RunVARRequest, db: Session = Depends(get_db)):
    """
    Run VAR (Vector AutoRegression) estimation pipeline as standalone endpoint.
    
    - **symbols**: List of ticker symbols
    - **start_date**: Start date in YYYY-MM-DD format
    - **end_date**: End date in YYYY-MM-DD format
    - **ridge_lambda**: Regularization parameter
    - **auto_ridge**: Whether to auto-select ridge parameter
    - **persist**: Whether to persist outputs to disk
    - **run_name**: Optional name for this run
    """
    try:
        logger.info(f"Running VAR pipeline for {request.symbols}")
        resolved_symbols, unresolved = await resolve_symbols(request.symbols)
        if unresolved:
            raise HTTPException(status_code=400, detail=f"Unable to resolve symbols: {', '.join(unresolved)}")
        if not resolved_symbols:
            raise HTTPException(status_code=400, detail="No valid symbols provided")
        
        # Fetch market data
        from app.services.data_fetcher import DataFetcher
        data_fetcher = DataFetcher()
        market_data = data_fetcher.fetch_ohlcv(
            symbols=resolved_symbols,
            start=request.start_date,
            end=request.end_date,
            save_to_db=True
        )
        
        if not market_data:
            raise HTTPException(status_code=400, detail="Failed to fetch market data")
        
        if not _feature_engineer_available or FeatureEngineer is None:
            raise HTTPException(status_code=503, detail="FeatureEngineer service unavailable (missing dependencies)")
        feature_engineer = FeatureEngineer()

        # Run VAR pipeline
        standardized, A, cov, diag = feature_engineer.pipeline_var_cov(
            data=market_data,
            ridge_lambda=request.ridge_lambda,
            auto_ridge=request.auto_ridge,
            persist_outputs=request.persist,
            save_db_record=False,
            run_name=request.run_name,
        )
        
        # Sanitize diagnostics eigenvalues again (defensive)
        eigs = diag.get('eigenvalues', [])
        sanitized_eigs = []
        for ev in eigs:
            if isinstance(ev, dict):
                sanitized_eigs.append(ev)
            elif isinstance(ev, complex):
                if abs(ev.imag) < 1e-12:
                    sanitized_eigs.append(float(ev.real))
                else:
                    sanitized_eigs.append({'real': float(ev.real), 'imag': float(ev.imag)})
            else:
                sanitized_eigs.append(ev)
        diag['eigenvalues'] = sanitized_eigs

        run_record = VarRunModel(
            run_name=request.run_name or f"var-{datetime.utcnow().isoformat()}",
            symbols=resolved_symbols,
            ridge_lambda=request.ridge_lambda,
            a_matrix=A.tolist(),
            cov_matrix=cov.tolist(),
            std_matrix=standardized.to_numpy().tolist() if hasattr(standardized, "to_numpy") else (standardized.tolist() if hasattr(standardized, "tolist") else None),
            diagnostics=diag,
        )
        db.add(run_record)
        db.commit()
        db.refresh(run_record)

        response_data = {
            "run_id": run_record.id,
                "symbols": resolved_symbols,
            "a_matrix": run_record.a_matrix,
            "covariance_matrix": run_record.cov_matrix,
            "diagnostics": diag,
            "created_at": run_record.created_at.isoformat(),
        }
        
        return ApiResponse(
            success=True,
            data=response_data,
            message="VAR pipeline executed successfully",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except ValueError as e:
        logger.error(f"ValueError in VAR pipeline: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error running VAR pipeline: {str(e)}")
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Error running VAR pipeline: {str(e)}")


@router.get("/var/runs", response_model=ApiResponse)
async def get_var_runs(db: Session = Depends(get_db)):
    """Get list of recent VAR runs from the database."""
    try:
        logger.info("Fetching VAR runs")
        runs = (
            db.query(VarRunModel)
            .order_by(VarRunModel.created_at.desc())
            .limit(50)
            .all()
        )
        data = [_serialize_var_run(run) for run in runs]
        return ApiResponse(
            success=True,
            data={"runs": data},
            message=f"Retrieved {len(data)} VAR runs",
            timestamp=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        logger.exception("Error fetching VAR runs")
        raise HTTPException(status_code=500, detail=f"Error fetching VAR runs: {str(e)}")


@router.get("/var/runs/{run_id}", response_model=ApiResponse)
async def get_var_run(run_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    """Get specific VAR run details."""
    try:
        logger.info(f"Fetching VAR run {run_id}")
        run = db.query(VarRunModel).filter(VarRunModel.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail=f"VAR run {run_id} not found")
        return ApiResponse(
            success=True,
            data=_serialize_var_run(run),
            message="VAR run retrieved",
            timestamp=datetime.utcnow().isoformat(),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching VAR run")
        raise HTTPException(status_code=500, detail=f"Error fetching VAR run: {str(e)}")
