"""Feature engineering endpoints."""

from fastapi import APIRouter, HTTPException, Path, Query
from typing import Optional, Dict, List, Any
from datetime import datetime
import logging
import numpy as np
import pandas as pd

try:
    from app.services.feature_engineer import FeatureEngineer
    _feature_engineer_available = True
except Exception:
    FeatureEngineer = None
    _feature_engineer_available = False
from app.models.schemas import (
    ComputeFeaturesRequest,
    FeaturesResponse,
    CorrelationRequest,
    CorrelationResponse,
    ApiResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/features", tags=["features"])


@router.post("/compute", response_model=ApiResponse)
async def compute_features(request: ComputeFeaturesRequest):
    """
    Compute technical features for symbols.
    
    - **symbols**: List of ticker symbols
    - **start_date**: Start date in YYYY-MM-DD format
    - **end_date**: End date in YYYY-MM-DD format
    - **save**: Whether to save features to database
    """
    try:
        logger.info(f"Computing features for {request.symbols}")

        # Ensure market data exists by fetching it first
        try:
            from app.services.data_fetcher import DataFetcher
            data_fetcher = DataFetcher()
            data_fetcher.fetch_ohlcv(
                symbols=request.symbols,
                start=request.start_date,
                end=request.end_date,
                save_to_db=True
            )
        except Exception as e:
            logger.warning(f"Market data fetch warning: {e}")
            # Continue anyway, maybe data is already in DB

        if not _feature_engineer_available or FeatureEngineer is None:
            raise HTTPException(status_code=503, detail="FeatureEngineer service unavailable (missing dependencies)")

        # Compute features using FeatureEngineer (instantiate lazily)
        feature_engineer = FeatureEngineer()
        features = feature_engineer.compute_features_bulk(
            symbols=request.symbols,
            start=request.start_date,
            end=request.end_date,
            save=request.save
        )
        
        if not features:
            raise HTTPException(status_code=400, detail="No features computed for symbols")
        
        # Convert DataFrames to list of dicts
        features_data = {}
        for symbol, df in features.items():
            records = []
            for idx, row in df.iterrows():
                record = {
                    "date": idx.strftime("%Y-%m-%d"),
                    "symbol": symbol,
                }
                # Add all feature columns
                for col in df.columns:
                    value = row[col]
                    try:
                        if value is None:
                            val = None
                        elif isinstance(value, (int, float, np.number)):
                            if np.isnan(value) or np.isinf(value):
                                val = None
                            else:
                                val = float(value)
                        else:
                            val = None
                        record[col.replace(" ", "_")] = val
                    except Exception:
                        record[col.replace(" ", "_")] = None
                records.append(record)
            features_data[symbol] = records
        
        # Safely get feature count
        feature_count = 0
        if request.symbols:
            first_sym = request.symbols[0]
            if first_sym in features:
                feature_count = len(features[first_sym].columns)
            elif features:
                # Fallback to any available symbol
                feature_count = len(next(iter(features.values())).columns)

        response_data = {
            "data": features_data,
            "symbols": request.symbols,
            "feature_count": feature_count,
        }
        
        return ApiResponse(
            success=True,
            data=response_data,
            message=f"Computed features for {len(request.symbols)} symbols",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error computing features: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error computing features: {str(e)}")


@router.get("/names", response_model=ApiResponse)
async def get_feature_names():
    """
    Get list of all available feature names.
    """
    try:
        # Return all feature names computed by FeatureEngineer
        feature_names = [
            "return",
            "log_return",
            "return_1", "return_2", "return_3",
            "sma_short", "sma_medium", "sma_long",
            "ema_short", "ema_medium",
            "mom_5", "mom_20",
            "vol_20", "zscore_60",
            "macd", "macd_signal", "macd_hist",
            "rsi_14",
            "atr_14",
            "vol_mean_20", "vol_zscore",
        ]
        
        return ApiResponse(
            success=True,
            data={"feature_names": feature_names},
            message=f"Retrieved {len(feature_names)} feature names",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error retrieving feature names: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving feature names: {str(e)}")


@router.get("/{symbol}", response_model=ApiResponse)
async def get_features(
    symbol: str = Path(..., description="Ticker symbol"),
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
):
    """
    Get computed features for a specific symbol.
    
    - **symbol**: Ticker symbol
    - **start_date**: Start date in YYYY-MM-DD format
    - **end_date**: End date in YYYY-MM-DD format
    """
    try:
        logger.info(f"Fetching features for {symbol}")

        if not _feature_engineer_available or FeatureEngineer is None:
            raise HTTPException(status_code=503, detail="FeatureEngineer service unavailable (missing dependencies)")

        # Fetch features using FeatureEngineer
        feature_engineer = FeatureEngineer()
        
        # Default dates if not provided
        s_date = start_date if start_date else "2023-01-01"
        e_date = end_date if end_date else datetime.now().strftime("%Y-%m-%d")

        # We use compute_features_bulk for consistency, even for a single symbol
        features = feature_engineer.compute_features_bulk(
            symbols=[symbol],
            start=s_date,
            end=e_date,
            save=False  # Don't overwrite existing files just for a read
        )
        
        if not features or symbol not in features:
            raise HTTPException(status_code=404, detail=f"No features found for symbol {symbol}")

        # Convert DataFrame to list of dicts
        df = features[symbol]
        records = []
        for idx, row in df.iterrows():
            # Ensure idx is treated as timestamp
            ts_idx = pd.Timestamp(idx) # type: ignore
            record: Dict[str, Any] = {
                "date": ts_idx.strftime("%Y-%m-%d"),
                "symbol": symbol,
            }
            # Add all feature columns
            for col in df.columns:
                value = row[col]
                try:
                    if value is None:
                        val = None
                    elif isinstance(value, (int, float, np.number)):
                        if np.isnan(value) or np.isinf(value):
                            val = None
                        else:
                            val = float(value)
                    else:
                        val = None
                    record[str(col).replace(" ", "_")] = val
                except Exception:
                    record[str(col).replace(" ", "_")] = None
            records.append(record)
        
        return ApiResponse(
            success=True,
            data={"symbol": symbol, "features": records},
            message=f"Fetched features for {symbol}",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Error fetching features for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching features for {symbol}: {str(e)}")


@router.post("/correlations", response_model=ApiResponse)
async def compute_correlations(request: CorrelationRequest):
    """
    Compute correlations between features for symbols.
    
    - **symbols**: List of ticker symbols
    - **start_date**: Start date in YYYY-MM-DD format
    - **end_date**: End date in YYYY-MM-DD format
    - **features**: Optional list of specific features to correlate
    """
    try:
        logger.info(f"Computing feature correlations for {request.symbols}")

        # Ensure market data exists by fetching it first
        try:
            logger.info("Fetching market data...")
            from app.services.data_fetcher import DataFetcher
            data_fetcher = DataFetcher()
            data_fetcher.fetch_ohlcv(
                symbols=request.symbols,
                start=request.start_date,
                end=request.end_date,
                save_to_db=True
            )
            logger.info("Market data fetched.")
        except Exception as e:
            logger.warning(f"Market data fetch warning: {e}")
            import traceback
            traceback.print_exc()

        if not _feature_engineer_available or FeatureEngineer is None:
            raise HTTPException(status_code=503, detail="FeatureEngineer service unavailable (missing dependencies)")

        # Compute features first
        try:
            logger.info("Computing features...")
            feature_engineer = FeatureEngineer()
            features = feature_engineer.compute_features_bulk(
                symbols=request.symbols,
                start=request.start_date,
                end=request.end_date,
                save=False
            )
            logger.info(f"Features computed. Keys: {list(features.keys()) if features else 'None'}")
        except Exception as e:
            logger.error(f"Error in compute_features_bulk: {e}")
            import traceback
            traceback.print_exc()
            raise

        # Combine features from all symbols
        combined_features = None
        if features:
            try:
                logger.info("Concatenating features...")
                # Convert dict_values to list to be safe
                dfs = list(features.values())
                if dfs:
                    logger.info(f"First DF type: {type(dfs[0])}")
                    combined_features = pd.concat(dfs)
                    logger.info(f"Concatenation complete. Shape: {combined_features.shape}")
                else:
                    logger.warning("Features dict has values but list is empty?")
            except Exception as e:
                logger.error(f"Error in pd.concat: {e}")
                import traceback
                traceback.print_exc()
                raise
        else:
            combined_features = None
        
        # Compute correlations
        if combined_features is not None and not combined_features.empty:
            try:
                logger.info("Computing correlation matrix...")
                # Filter for numeric columns only
                numeric_df = combined_features.select_dtypes(include=[np.number])
                if numeric_df.empty:
                    logger.warning("No numeric columns found for correlation.")
                    correlations = {}
                else:
                    corr_matrix = numeric_df.corr()
                    logger.info("Correlation matrix computed.")
                    # Handle NaN/Inf in correlation matrix
                    correlations = corr_matrix.where(pd.notnull(corr_matrix), None).to_dict()
                    logger.info("Correlations converted to dict.")
            except Exception as e:
                logger.error(f"Error in correlation computation: {e}")
                import traceback
                traceback.print_exc()
                raise
        else:
            correlations = {}
        
        response_data = {
            "correlations": correlations,
            "symbols": request.symbols,
            "sample_size": len(combined_features) if combined_features is not None else 0,
        }
        
        return ApiResponse(
            success=True,
            data=response_data,
            message="Feature correlations computed",
            timestamp=datetime.utcnow().isoformat(),
        )
    
    except Exception as e:
        import traceback
        logger.error(f"Error computing correlations: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error computing correlations: {str(e)}")
