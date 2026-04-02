"""
FastAPI server for Quant Trading Assistant
Exposes backend services via REST API for frontend integration.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

from app.core.config import settings

# Import all routers
from app.api.routes import data, features, portfolio, signals, risk, backtest, user
from app.models.database import init_db, engine
from sqlalchemy.exc import OperationalError

app = FastAPI(
    title="Quant Trading Assistant API",
    version="1.0.0",
    description="REST API for quantitative trading and portfolio optimization"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
    ],  # include additional dev ports
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",  # wildcard localhost ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(data.router, prefix="/api")
app.include_router(features.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
app.include_router(signals.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(backtest.router, prefix="/api")
app.include_router(user.router, prefix="/api")

logger.info("All API routers registered successfully")

# --- Startup / Shutdown Events ---
@app.on_event("startup")
def _startup_init_db():
    try:
        init_db()
        logger.info("Database tables ensured/initialized successfully")
    except OperationalError as e:
        logger.error(f"Database initialization failed: {e}")
    except Exception as e:
        logger.exception(f"Unexpected error during DB init: {e}")

@app.on_event("startup")
def _log_config():
    logger.info(f"Settings DATABASE_URL={settings.DATABASE_URL}")

@app.on_event("shutdown")
def _shutdown_log():
    logger.info("Shutting down Quant Trading Assistant API")

# Request/Response models
class FetchOHLCVRequest(BaseModel):
    symbols: List[str]
    start_date: str
    end_date: str
    save_to_db: bool = True

class ConstructPortfolioRequest(BaseModel):
    symbols: List[str]
    start_date: str
    end_date: str
    method: str = "sparse_mean_reverting"
    sparsity_k: int = 15
    max_weight: float = 0.25
    risk_aversion: float = 1.0
    ridge_lambda: float = 0.001

class GenerateSignalsRequest(BaseModel):
    target_weights: Dict[str, float]
    current_qty: Dict[str, int]
    prices: Dict[str, float]
    capital: Optional[float] = None

class RunBacktestRequest(BaseModel):
    symbols: List[str]
    start_date: str
    end_date: str
    weights: Dict[str, float]
    initial_capital: float = 100000
    commission_rate: float = 0.0005
    slippage_pct: float = 0.0005
    rebalance_freq_days: int = 7

class RiskStatusResponse(BaseModel):
    current_drawdown: float
    drawdown_limit: float
    is_safe: bool
    message: Optional[str] = None


# Health check
@app.get("/")
async def root():
    return {
        "message": "Quant Trading Assistant API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

