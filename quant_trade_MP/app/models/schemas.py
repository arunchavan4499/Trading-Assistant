"""
API Request/Response Pydantic models for all endpoints.
Defines contract between frontend and backend.
"""

from typing import Any, Dict, List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field


# ============================================================================
# MARKET DATA SCHEMAS
# ============================================================================

class FetchOHLCVRequest(BaseModel):
    """Request to fetch OHLCV data for symbols."""
    symbols: List[str] = Field(..., min_items=1, description="List of ticker symbols")
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    save_to_db: bool = Field(default=True, description="Whether to save data to database")


class OHLCVData(BaseModel):
    """Single OHLCV candle."""
    date: str
    open: float
    high: float
    low: float
    close: float
    adj_close: float
    volume: int


class OHLCVResponse(BaseModel):
    """Response with OHLCV data for symbols."""
    data: Dict[str, List[OHLCVData]]
    symbols: List[str]
    date_range: Dict[str, str] = Field(..., description="{'start_date': '...', 'end_date': '...'}")
    record_count: Dict[str, int]


class DataSummary(BaseModel):
    """Summary of available market data."""
    symbols: List[str]
    coverage: Dict[str, Dict[str, str]]  # {symbol: {start_date, end_date, record_count}}
    total_symbols: int
    date_range: Dict[str, str]


# ============================================================================
# FEATURE ENGINEERING SCHEMAS
# ============================================================================

class ComputeFeaturesRequest(BaseModel):
    """Request to compute technical features."""
    symbols: List[str] = Field(..., min_items=1)
    start_date: str
    end_date: str
    save: bool = Field(default=True)


class FeatureData(BaseModel):
    """Single feature data point."""
    date: str
    symbol: str
    return_: Optional[float] = Field(None, alias="return")
    log_return: Optional[float] = None
    sma_short: Optional[float] = None
    sma_medium: Optional[float] = None
    sma_long: Optional[float] = None
    ema_short: Optional[float] = None
    ema_medium: Optional[float] = None
    mom_5: Optional[float] = None
    mom_20: Optional[float] = None
    vol_20: Optional[float] = None
    zscore_60: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_hist: Optional[float] = None
    rsi_14: Optional[float] = None
    atr_14: Optional[float] = None
    vol_mean_20: Optional[float] = None
    vol_zscore: Optional[float] = None

    class Config:
        populate_by_name = True


class FeaturesResponse(BaseModel):
    """Response with computed features."""
    data: Dict[str, List[FeatureData]]
    symbols: List[str]
    feature_count: int


class CorrelationRequest(BaseModel):
    """Request to compute feature correlations."""
    symbols: List[str] = Field(..., min_items=1)
    start_date: str
    end_date: str
    features: Optional[List[str]] = Field(None, description="Specific features to correlate; if None, all")


class CorrelationResponse(BaseModel):
    """Response with feature correlations."""
    correlations: Dict[str, Dict[str, float]]  # {feature1: {feature2: correlation, ...}, ...}
    symbols: List[str]
    sample_size: int


# ============================================================================
# PORTFOLIO CONSTRUCTION SCHEMAS
# ============================================================================

class PortfolioOptions(BaseModel):
    """Portfolio construction options."""
    max_weight: float = Field(default=0.25, ge=0.0, le=1.0)
    min_weight: float = Field(default=0.0, ge=0.0, le=1.0)
    allow_short: bool = Field(default=False)
    method: Literal["mean_variance", "minvar", "sparse_mean_reverting"] = "sparse_mean_reverting"
    risk_aversion: float = Field(default=1.0, gt=0.0)
    sparsity_k: int = Field(default=10, ge=1)
    sparsity_keep_signed: bool = Field(default=False)
    cov_ridge: float = Field(default=1e-6, ge=0.0)
    use_graphical_lasso: bool = Field(default=False)
    persist: bool = Field(default=True)
    run_name: Optional[str] = None
    verbose: bool = Field(default=True)


class ConstructPortfolioRequest(BaseModel):
    """Request to construct portfolio."""
    symbols: List[str] = Field(..., min_items=1)
    start_date: str
    end_date: str
    ridge_lambda: float = Field(default=1e-3, ge=0.0, description="Regularization parameter for VAR")
    options: PortfolioOptions = Field(default_factory=PortfolioOptions)


class PortfolioWeights(BaseModel):
    """Portfolio weights for each asset."""
    # Simple type alias - just use Dict[str, float]
    weights: Dict[str, float] = {}

    class Config:
        populate_by_name = True


class PortfolioMetrics(BaseModel):
    """Portfolio performance metrics."""
    expected_return: Optional[float] = None
    variance: Optional[float] = None
    std_dev: Optional[float] = None
    portfolio_std: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    sparsity: Optional[int] = None
    num_assets: int


class ConstructPortfolioResponse(BaseModel):
    """Response with constructed portfolio."""
    weights: Dict[str, float]
    metrics: PortfolioMetrics
    run_id: Optional[int] = None
    method: str
    created_at: str


class CovarianceRequest(BaseModel):
    """Request to compute covariance matrix."""
    symbols: List[str] = Field(..., min_items=1)
    start_date: str
    end_date: str
    ridge_lambda: float = Field(default=1e-3, ge=0.0)


class CovarianceResponse(BaseModel):
    """Response with covariance matrix."""
    covariance_matrix: List[List[float]]
    symbols: List[str]
    ridge_lambda: float


class RunVARRequest(BaseModel):
    """Request to run VAR estimation pipeline."""
    symbols: List[str] = Field(..., min_items=1)
    start_date: str
    end_date: str
    ridge_lambda: float = Field(default=1e-3, ge=0.0)
    auto_ridge: bool = Field(default=True)
    persist: bool = Field(default=True)
    run_name: Optional[str] = None


class RunVARResponse(BaseModel):
    """Response from VAR estimation."""
    run_id: int
    symbols: List[str]
    a_matrix: List[List[float]]
    covariance_matrix: List[List[float]]
    diagnostics: Dict[str, Any]
    created_at: str


class PortfolioRun(BaseModel):
    """Historical portfolio run record."""
    id: int
    run_name: str
    symbols: List[str]
    weights: Dict[str, float]
    method: str
    metrics: PortfolioMetrics
    created_at: str

    class Config:
        from_attributes = True


class VARRun(BaseModel):
    """Historical VAR run record."""
    id: int
    run_name: str
    symbols: List[str]
    a_matrix_path: str
    cov_matrix_path: str
    diagnostics_path: str
    created_at: str

    class Config:
        from_attributes = True


# ============================================================================
# SIGNAL GENERATION SCHEMAS
# ============================================================================

class GenerateRebalanceRequest(BaseModel):
    """Request to generate rebalance trades."""
    target_weights: Dict[str, float] = Field(..., description="Target portfolio weights")
    current_qty: Dict[str, int] = Field(..., description="Current quantities held")
    prices: Dict[str, float] = Field(..., description="Current market prices")
    cash: float = Field(default=0.0, description="Available cash")
    capital: Optional[float] = Field(None, description="Total portfolio capital")
    current_equity: Optional[float] = Field(None, description="Current portfolio equity (for drawdown check)")
    peak_equity: Optional[float] = Field(None, description="Peak equity to date (for drawdown check)")


class TradeDetail(BaseModel):
    """Single trade detail."""
    symbol: str
    side: Literal["BUY", "SELL", "HOLD"]
    quantity: float
    price: float
    notional: float
    target_notional: Optional[float] = 0.0
    current_notional: Optional[float] = 0.0
    notional_diff: Optional[float] = 0.0
    deviation: Optional[float] = 0.0


class RebalancePlan(BaseModel):
    """Response with rebalance trade plan."""
    trades: Dict[str, TradeDetail]
    summary: Dict[str, Any]  # total_notional, num_trades, etc.
    execution_order: List[str]


class GenerateSimpleSignalRequest(BaseModel):
    """Request to generate simple signal."""
    current_value: float
    target_value: float
    portfolio: Dict[str, float]
    deviation_threshold: float = Field(default=0.02)


class SimpleSignal(BaseModel):
    """Simple signal response."""
    signal: Literal["BUY", "SELL", "HOLD"]
    deviation: float
    current_value: float
    target_value: float
    message: str
    portfolio: Dict[str, float]
    timestamp: str


class PortfolioValueRequest(BaseModel):
    """Request to calculate portfolio value."""
    portfolio: Dict[str, float]
    prices: Dict[str, float]


class PortfolioValueResponse(BaseModel):
    """Response with portfolio value."""
    value: float
    portfolio: Dict[str, float]
    prices: Dict[str, float]


# ============================================================================
# BACKTEST SCHEMAS
# ============================================================================

class BacktestConfig(BaseModel):
    """Backtest configuration."""
    symbols: List[str] = Field(..., min_items=1)
    start_date: str
    end_date: str
    weights: Dict[str, float]
    initial_capital: float = Field(default=100000.0, gt=0.0)
    commission_rate: float = Field(default=0.0005, ge=0.0)
    slippage_pct: float = Field(default=0.0005, ge=0.0)
    rebalance_freq_days: int = Field(default=7, ge=1)
    run_name: Optional[str] = None


class TradeRecord(BaseModel):
    """Single trade from backtest."""
    date: str
    symbol: str
    side: str
    quantity: float
    price: float
    notional: float
    fees_and_slippage: float


class EquityPoint(BaseModel):
    """Single equity point."""
    date: str
    equity: float
    cash: float
    positions_value: float


class BacktestMetrics(BaseModel):
    """Backtest performance metrics."""
    sharpe: float
    sortino: float
    max_drawdown: float
    annual_return: float
    annual_vol: float
    n_periods: int
    total_return: float
    num_trades: int
    winning_trades: int
    losing_trades: int
    avg_win: float
    avg_loss: float
    
    @property
    def ann_return(self) -> float:
        """Alias for annual_return (backwards compatibility with frontend)."""
        return self.annual_return
    
    @property
    def ann_vol(self) -> float:
        """Alias for annual_vol (backwards compatibility with frontend)."""
        return self.annual_vol
    
    def dict(self, **kwargs) -> dict:
        """Override dict() to include ann_return and ann_vol aliases."""
        d = super().dict(**kwargs)
        d['ann_return'] = self.annual_return
        d['ann_vol'] = self.annual_vol
        return d


class BacktestResultResponse(BaseModel):
    """Complete backtest result."""
    run_id: Optional[int] = None
    config: BacktestConfig
    metrics: BacktestMetrics
    equity_curve: List[EquityPoint]
    trades: List[TradeRecord]
    created_at: str


class BacktestRun(BaseModel):
    """Historical backtest run."""
    id: int
    run_name: str
    config: Dict[str, Any]
    metrics: BacktestMetrics
    created_at: str

    class Config:
        from_attributes = True


class BacktestJobResponse(BaseModel):
    """Response from async backtest submission."""
    job_id: str
    status_url: str
    message: str


class BacktestStatusResponse(BaseModel):
    """Status of a backtest job."""
    job_id: str
    status: Literal["pending", "running", "completed", "failed"]
    progress: float = Field(ge=0.0, le=100.0)
    message: Optional[str] = None
    result_url: Optional[str] = None


# ============================================================================
# RISK MANAGEMENT SCHEMAS
# ============================================================================

class RiskLimits(BaseModel):
    """Risk limits configuration."""
    max_position_fraction: float = Field(default=0.20, ge=0.0, le=1.0)
    max_portfolio_exposure: float = Field(default=1.0, ge=0.0)
    min_cash_buffer: float = Field(default=0.0, ge=0.0)
    use_half_kelly: bool = Field(default=True)
    max_drawdown: float = Field(default=0.2, ge=0.0, le=1.0)


class RiskValidationRequest(BaseModel):
    """Request to validate portfolio against risk limits."""
    weights: Dict[str, float]
    current_equity: float
    peak_equity: float
    limits: Optional[RiskLimits] = None


class RiskStatus(BaseModel):
    """Risk status response."""
    is_safe: bool
    current_drawdown: float
    max_drawdown_limit: float
    drawdown_warning: bool
    violations: List[str]
    message: str
    timestamp: str


class DrawdownRecord(BaseModel):
    """Historical drawdown point."""
    date: str
    equity: float
    drawdown: float


# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserConfig(BaseModel):
    """User application configuration."""
    default_sparsity: int = Field(default=15, ge=1)
    deviation_threshold: float = Field(default=0.02, ge=0.0)
    max_position_size: float = Field(default=0.20, ge=0.0, le=1.0)
    initial_capital: float = Field(default=100000.0, gt=0.0)
    theme: str = Field(default="light")
    notifications_enabled: bool = Field(default=True)


class User(BaseModel):
    """User profile."""
    id: int
    name: str
    email: str
    drawdown_limit: Optional[float] = None
    max_assets: Optional[int] = None
    config: UserConfig
    created_at: str

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    """Request to update user."""
    name: Optional[str] = None
    email: Optional[str] = None
    drawdown_limit: Optional[float] = None
    max_assets: Optional[int] = None
    config: Optional[UserConfig] = None


# ============================================================================
# GENERIC RESPONSE WRAPPER
# ============================================================================

T = Any  # TypeVar not directly supported in BaseModel, use Any


class ApiResponse(BaseModel):
    """Standardized API response wrapper."""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    message: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        arbitrary_types_allowed = True
