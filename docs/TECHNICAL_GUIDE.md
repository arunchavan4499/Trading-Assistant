# TECHNICAL_GUIDE.md

Comprehensive technical documentation for the Quant Trading Assistant project. This guide covers architecture, conventions, patterns, and development workflows.

---

## 📖 Table of Contents

1. [Big Picture: Data Pipeline](#big-picture-data-pipeline)
2. [Critical Workflows](#critical-workflows)
3. [Project-Specific Patterns](#project-specific-patterns)
4. [Architecture Deep Dive](#architecture-deep-dive)
5. [Database Schema](#database-schema)
6. [Configuration & Environment](#configuration--environment)
7. [Debugging Hot Spots](#debugging-hot-spots)
8. [Key Files Reference](#key-files-reference)

---

## Big Picture: Data Pipeline

The system implements a 5-stage data pipeline with persistence at each stage:

### Stage 1: Fetch Market Data
- **Input**: Symbols (AAPL, MSFT, etc.) + date range
- **Service**: `DataFetcher` → yfinance
- **Output**: Aligned OHLCV DataFrame
- **Persistence**: `market_data` DB table
- **Why**: Enable reproducible backtests without re-fetching data

### Stage 2: Engineer Features
- **Input**: Price DataFrame
- **Service**: `FeatureEngineer`
- **Outputs**: 
  - Technical indicators (SMA, EMA, RSI, MACD, ATR)
  - VAR(1) state-space A matrix
  - Covariance matrix
  - Standardized returns
  - Diagnostics (n_obs, condition_number, eigenvalues)
- **Persistence**: 
  - Per-symbol features → `data/processed/{SYMBOL}_features.parquet`
  - VAR outputs → `data/processed/var_outputs/<timestamp>/`
  - Diagnostics → `data/processed/diagnostics/diag_<timestamp>.json`
  - Metadata → `var_runs` DB table
- **Why**: VAR estimation is expensive; save matrices for quick re-backtesting

### Stage 3: Optimize Portfolio
- **Input**: Covariance matrix, standardized returns
- **Service**: `PortfolioConstructor`
- **Algorithm**: Box-Tiao decomposition → sparse eigenvector → normalized weights
- **Output**: Weights (symbol → allocation), metrics (Sharpe, variance, expected return)
- **Persistence**: `portfolio_runs` DB table
- **Why**: Portfolio construction is deterministic; reuse saved weights

### Stage 4: Generate Signals
- **Input**: Target weights, current holdings, prices
- **Service**: `TradeSignalEngine`
- **Output**: Rebalance trades (symbol → BUY/SELL/HOLD quantity)
- **Persistence**: None (pure computation)
- **Why**: Stateless, repeatable, no need to persist

### Stage 5: Backtest with Costs
- **Input**: Target weights time-series, price history, initial capital
- **Service**: `Backtester`
- **Simulation**: Walk-forward windows, weekly rebalancing, realistic costs
- **Output**: Equity curve, daily returns, trade log, metrics (Sharpe, max DD, etc.)
- **Persistence**: `results/backtest_report.json` + `results/backtest_daily.csv`
- **Why**: Final validation before deploying signals

**Key Principle**: Each service is **stateless and deterministic**. Same inputs always produce same outputs, enabling safe re-execution and caching.

---

## Critical Workflows (Copy-Paste Ready)

### Workflow 1: Start Backend Dev Server
```powershell
cd a:\WD Projecs\Trading_Assistant\QuantTrade_AI
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

Wait for: `Uvicorn running on http://127.0.0.1:8000` + `Application startup complete`

### Workflow 2: Run Full Walk-Forward Backtest
```powershell
# Executes all 5 stages: fetch → features → portfolio → signals → backtest
python scripts/walkforward_backtest.py

# Output:
# - results/backtest_report.json (summary metrics)
# - results/backtest_daily.csv (daily equity curve)
# - data/processed/diagnostics/diag_*.json (VAR diagnostics)
```

### Workflow 3: Start Frontend Dev Server
```powershell
cd frontend
npm install  # First time only
npm run dev
# Frontend at http://localhost:5173 (or 3000)
# Proxy: /api → http://localhost:8000
```

### Workflow 4: Verify Backend-Frontend Connection
```powershell
# Terminal 1: Start backend (from above)
# Terminal 2: Start frontend (from above)
# Browser: http://localhost:3000 → F12 → Console

# Paste this:
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Connected:', d))
  .catch(e => console.error('❌ Failed:', e))
```

Expected output: `{status: 'healthy', timestamp: '...'}`

### Workflow 5: Test Portfolio Construction API
```powershell
# Browser Console:
fetch('/api/portfolio/construct', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbols: ['AAPL', 'MSFT', 'GOOGL'],
    start_date: '2024-01-01',
    end_date: '2024-11-22',
    method: 'sparse_mean_reverting',
    sparsity_k: 3,
    max_weight: 0.5,
    ridge_lambda: 0.001
  })
})
  .then(r => r.json())
  .then(d => console.log('Weights:', d.data.weights, 'Sharpe:', d.data.metrics.sharpe_ratio))
  .catch(e => console.error('Error:', e))
```

Expected: Weights summing to ~1.0, Sharpe ratio metric

### Workflow 6: Inspect VAR Diagnostics
```powershell
# View latest diagnostics
Get-Content data/processed/diagnostics/*.json | ConvertFrom-Json | Select-Object n_obs, used_ridge_lambda, condition_number

# View VAR matrix outputs
ls data/processed/var_outputs/*/

# Manual Python inspection
python -c "
import json
from pathlib import Path
diags = sorted(Path('data/processed/diagnostics').glob('*.json'))
if diags:
    with open(diags[-1]) as f:
        d = json.load(f)
        print(f'Observations: {d[\"n_obs\"]}')
        print(f'Condition number: {d[\"condition_number\"]:.2e}')
        print(f'Ridge lambda: {d[\"used_ridge_lambda\"]}')
"
```

---

## Project-Specific Patterns (Never Deviate)

### Pattern 1: Timezones Always UTC

**Rule**: All `DatetimeIndex` must be **UTC-aware** (never naive).

**Implementation**:
```python
# ✅ CORRECT
import pandas as pd
df.index = pd.to_datetime(df.index).tz_localize('UTC')
df.index = df.index.tz_convert('UTC')  # Convert from other timezone

# ❌ WRONG
df.index = pd.to_datetime(df.index)  # Naive datetime!
```

**In Database**: All timestamps use `DateTime(timezone=True)` column type, UTC implicit.

**Why**: Silent comparison bugs with naive datetimes across multi-source data. `2024-01-01 12:00:00` (no tz) != `2024-01-01 12:00:00 UTC`

**Where to Check**: `app/services/data_fetcher.py` line 50+ (`_normalize_yf_df()`)

---

### Pattern 2: Price Column: Prefer adj_close

**Rule**: Use `adj_close` (dividend/split adjusted) in all strategy logic.

**Implementation**:
```python
# ✅ CORRECT - Use adj_close for returns
returns = np.log(prices['adj_close']).diff()

# ✅ FALLBACK - If adj_close missing, use close
price_col = 'adj_close' if 'adj_close' in prices else 'close'
returns = np.log(prices[price_col]).diff()

# ❌ WRONG - Using unadjusted close
returns = np.log(prices['close']).diff()  # Ignores splits/dividends!
```

**Where to Check**: `app/services/data_fetcher.py` `_normalize_yf_df()` method

**Why**: Dividends and stock splits distort returns. AAPL 7-for-1 split in 2014 needs adjustment.

---

### Pattern 3: VAR(1) Estimation: Standardize First

**Rule**: All returns must be **standardized to zero mean, unit variance** before VAR regression.

**Mathematical Model**:
$$R_t = A R_{t-1} + \epsilon_t$$

Where $R_t$ = standardized returns (not raw returns)

**Implementation**:
```python
from sklearn.preprocessing import StandardScaler

# ✅ CORRECT
scaler = StandardScaler()
returns_raw = np.log(prices).diff().dropna()
returns_std = scaler.fit_transform(returns_raw)  # Zero mean, unit variance
# Then estimate: A @ returns_std[t] ≈ returns_std[t+1]
ridge_coeff = ridge_regression(returns_std[:-1], returns_std[1:], lambda)

# ❌ WRONG - Skip standardization
ridge_coeff = ridge_regression(returns_raw[:-1], returns_raw[1:], lambda)  # Wrong scale!
```

**Where**: `app/services/feature_engineer.py` `pipeline_var_cov()` method

**Why**: VAR assumes stationarity. Raw returns have different scales across assets (e.g., AAPL ~0.5% daily, NVDA ~3% daily). Standardization stabilizes estimation.

---

### Pattern 4: Portfolio Weights: Always Normalized

**Rule**: Weights must sum to **≈1.0** (long-only) or L1-normalized (long-short).

**Never leave NaN weights** — clamp + renormalize if calculation fails.

**Implementation**:
```python
# ✅ CORRECT - Long-only, sum to 1
weights = softmax(z)  # Always sums to 1
assert abs(weights.sum() - 1.0) < 1e-6

# ✅ Long-short, L1-normalized
abs_sum = np.abs(weights).sum()
weights_l1 = weights / abs_sum  # L1 norm = 1
assert abs(np.abs(weights_l1).sum() - 1.0) < 1e-6

# ✅ With max weight constraint
weights = clamp(weights, 0, 0.20)  # Each weight ≤ 20%
weights = weights / weights.sum()   # Renormalize

# ❌ WRONG - Unnormalized
weights = [0.3, 0.2, 0.4]  # Sum = 0.9, not 1.0!

# ❌ WRONG - Contains NaN
weights = [0.3, nan, 0.3]  # NaN breaks calculations downstream
```

**Helper Functions** (in `app/services/portfolio_constructor.py`):
- `_project_to_long_only(w)` — Project to simplex (non-negative, sum≈1)
- `_l1_normalize_preserve_sign(w)` — L1-normalize long-short weights
- `_clamp_max_weight(w, max_abs)` — Clamp + renormalize

**Where to Check**: `portfolio_constructor.py` `_normalize_weights_for_output()` method

---

### Pattern 5: Mean-Reversion Signal Logic

**Rule**: Generate BUY/SELL/HOLD signals based on portfolio deviation from target.

**Formula**:
```
deviation = (current_portfolio_value - target_value) / target_value

if deviation > DEVIATION_THRESHOLD (2%):   → SELL (reduce)
elif deviation < -DEVIATION_THRESHOLD:     → BUY (increase)
else:                                      → HOLD
```

**Implementation**:
```python
class TradeSignalEngine:
    def generate_signal(self, current_value, target_value, portfolio):
        deviation = (current_value - target_value) / target_value
        
        if deviation > self.threshold:
            return SignalType.SELL, deviation
        elif deviation < -self.threshold:
            return SignalType.BUY, deviation
        else:
            return SignalType.HOLD, deviation
```

**Where**: `app/services/trade_signal_engine.py` `generate_signal()` method

**Default Threshold**: 2% (from `DEVIATION_THRESHOLD` in `app/core/config.py`)

---

### Pattern 6: Backtesting: Walk-Forward

**Rule**: Train VAR + covariance up to each rebalance date (inclusive). Hold weights constant until next rebalance.

**Structure**:
```
Timeline:
|----Training Window 1----|Rebalance 1|
                          |----Training Window 2----|Rebalance 2|
                                                    |----Training 3----|

Procedure:
1. For each rebalance date t:
   - Use data from [start, t] to estimate VAR + covariance
   - Construct portfolio weights
   - Hold weights from t to t+freq (e.g., +7 days)
2. Simulate trading with costs:
   - Commission: 0.05% per side (buy/sell)
   - Slippage: 0.05% (price impact)
3. Calculate metrics:
   - Daily returns
   - Cumulative equity curve
   - Annualized return, volatility, Sharpe, max drawdown
```

**Implementation**:
```python
for i, reb_date in enumerate(rebalance_dates):
    # Training: use data up to reb_date (inclusive)
    data_cut = data[data.index <= reb_date]
    
    # Estimate VAR + covariance
    std_rets, A, cov = fe.pipeline_var_cov(data_cut)
    
    # Construct weights
    weights = construct_portfolio_from_var_and_cov(cov)
    
    # Hold weights until next rebalance date (or end)
    next_reb = rebalance_dates[i+1] if i+1 < len(rebalance_dates) else end_date
    for date in pd.date_range(reb_date, next_reb, freq='1D'):
        # Simulate trading with weights constant
        equity[date] = apply_weights_and_costs(weights, prices[date])
```

**Key Details**:
- **Training window**: Up to rebalance date (inclusive)
- **Rebalancing frequency**: Configurable (1D, 7D, 30D)
- **Weights held constant** between rebalances
- **Costs applied per trade** (buy/sell)
- **Metrics saved**: Equity curve CSV + summary JSON

**Where**: `scripts/walkforward_backtest.py` and `app/services/backtester.py`

---

## Architecture Deep Dive

### Service Dependency Graph

```
DataFetcher
    ↓ (prices)
FeatureEngineer (VAR + covariance)
    ↓ (cov matrix)
PortfolioConstructor
    ↓ (weights)
TradeSignalEngine
    ↓ (signals)
Backtester
    ↓ (equity curve)
PerformanceEvaluator
    ↓ (Sharpe, DD, etc.)
RiskManager (parallel: enforce constraints)
```

### Persistence Strategy

Each service saves outputs to enable re-execution:

| Stage | Output | Persistence | Retention |
|-------|--------|-------------|-----------|
| DataFetcher | OHLCV | DB `market_data` table | ∞ (reuse) |
| FeatureEngineer | VAR matrices, diagnostics | Disk (`data/processed/var_outputs/<ts>/`) + DB | Keep 5 recent |
| PortfolioConstructor | Weights + metrics | DB `portfolio_runs` table | ∞ |
| TradeSignalEngine | Rebalance plan | None (stateless) | N/A |
| Backtester | Equity curve | Disk CSV + JSON | ∞ |

**Benefit**: If you re-run Stage 5 (backtest), you don't re-run Stages 1-3.

### API Layer: Route Orchestration

Each REST endpoint chains services:

```
POST /api/portfolio/construct
├── DataFetcher.fetch_ohlcv(symbols, dates)
├── FeatureEngineer.pipeline_var_cov(prices)
├── PortfolioConstructor(cov, prices)
└── Response: weights, metrics, diagnostics

POST /api/backtest/run
├── Load portfolio_runs by ID (or construct fresh)
├── Backtester(weights, prices, capital)
├── PerformanceEvaluator(returns)
└── Response: equity curve, daily returns, trades, metrics
```

---

## Database Schema

### market_data
```sql
CREATE TABLE market_data (
    id INTEGER PRIMARY KEY,
    symbol VARCHAR NOT NULL,
    date DATE NOT NULL,
    open FLOAT NOT NULL,
    high FLOAT NOT NULL,
    low FLOAT NOT NULL,
    close FLOAT NOT NULL,
    adj_close FLOAT NOT NULL,
    volume INTEGER NOT NULL,
    UNIQUE(symbol, date),
    INDEX idx_symbol_date
);
```

**Usage**: Fast lookups by (symbol, date). Used by DataFetcher, FeatureEngineer, Backtester.

### portfolio_runs
```sql
CREATE TABLE portfolio_runs (
    id INTEGER PRIMARY KEY,
    run_name VARCHAR UNIQUE,
    symbols JSON,              -- ["AAPL", "MSFT", "GOOGL"]
    weights_json JSON,         -- {"AAPL": 0.3, "MSFT": 0.5, "GOOGL": 0.2}
    method VARCHAR,            -- 'sparse_mean_reverting'
    metrics JSON,              -- {"sharpe_ratio": 0.75, "expected_return": 0.12, ...}
    created_at DATETIME
);
```

**Usage**: Track portfolio construction results. API `/api/portfolio/runs` returns history.

### var_runs
```sql
CREATE TABLE var_runs (
    id INTEGER PRIMARY KEY,
    symbols JSON,              -- ["AAPL", "MSFT", "GOOGL"]
    run_name VARCHAR,
    run_id VARCHAR,            -- '20251122T100609Z'
    method VARCHAR,            -- 'pipeline_var_cov'
    diagnostics JSON,          -- {"n_obs": 252, "condition_number": 1e5, ...}
    created_at DATETIME
);
```

**Usage**: Track VAR estimation runs. Used for diagnostics + reproducibility.

### users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    drawdown_limit FLOAT DEFAULT 0.25,   -- 25% max drawdown
    max_assets INTEGER                   -- Max per-asset allocation
);
```

**Usage**: User-specific risk parameters. Can extend with auth later.

---

## Configuration & Environment

### Pydantic Settings Pattern

File: `app/core/config.py`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str                    # From .env
    DEFAULT_SPARSITY: int = 15           # K in Box-Tiao
    DEVIATION_THRESHOLD: float = 0.02    # 2% trigger
    MAX_POSITION_SIZE: float = 0.20      # 20% max per asset
    DATA_START_DATE: str = "2020-01-01"
    DATA_END_DATE: str = "2024-10-01"
    
    class Config:
        env_file = ".env"
        validate_assignment = True

settings = Settings()  # Loaded once at startup
```

### .env File Pattern

**Create** `.env` in project root (never commit):
```
DATABASE_URL=sqlite:///./test.db
# Or PostgreSQL for production:
# DATABASE_URL=postgresql://user:password@localhost/quant_trading
```

**Access** in code:
```python
from app.core.config import settings
print(settings.DATABASE_URL)
print(settings.DEFAULT_SPARSITY)
```

### Environment-Specific Setup

**Development** (SQLite):
```
DATABASE_URL=sqlite:///./test.db
DEFAULT_SPARSITY=15
DEVIATION_THRESHOLD=0.02
```

**Production** (PostgreSQL):
```
DATABASE_URL=postgresql://prod_user:secure_pwd@db.prod.example.com/quant_trading
DEFAULT_SPARSITY=30
DEVIATION_THRESHOLD=0.01
```

---

## Debugging Hot Spots

### Problem 1: `AttributeError: can't set attribute on naive datetime`

**Root Cause**: Datetime column is naive (no timezone info).

**Diagnosis**:
```python
df.index.tz  # Returns None → naive
```

**Fix**:
```python
# Option 1: Localize from UTC
df.index = df.index.tz_localize('UTC')

# Option 2: Convert from other timezone
df.index = df.index.tz_convert('UTC')
```

**Where to Check**: `app/services/data_fetcher.py` `_normalize_yf_df()` method

---

### Problem 2: `LinAlgError: singular matrix` or `invalid ridge lambda`

**Root Cause**: Covariance matrix is singular (determinant = 0). Happens when:
- Too few observations (< 2 × n_assets)
- Perfect correlation between assets
- Missing data (NaN values)
- Bad ridge lambda

**Diagnosis**:
```python
# Check diagnostics JSON
condition_number = diagnostics['condition_number']
if condition_number > 1e6:
    print("⚠️ Covariance ill-conditioned")
```

**Fix**:
```python
# Option 1: Use more data
start_date = '2020-01-01'  # Longer history
end_date = '2024-11-22'

# Option 2: Fewer assets
symbols = ['AAPL', 'MSFT', 'GOOGL']  # Reduce from 30 to 3

# Option 3: Ridge regularization auto-increases
# (Already done in FeatureEngineer if condition_number > 1e6)

# Option 4: Manual ridge
feature_eng = FeatureEngineer()
std_rets, A, cov = feature_eng.pipeline_var_cov(
    data, 
    override_ridge_lambda=0.01  # Increase ridge
)
```

**Where to Check**: `app/services/feature_engineer.py` `pipeline_var_cov()` diagnostics

---

### Problem 3: `Weights don't sum to 1.0` or `Weights contain NaN`

**Root Cause**: Normalization failed mid-pipeline.

**Diagnosis**:
```python
weights = construct_portfolio(cov)
print(weights.sum())  # Should be ~1.0
print(weights.isna().sum())  # Should be 0
```

**Fix**:
```python
# Trace through normalization functions
weights = _project_to_long_only(weights)  # Project to simplex
weights = _clamp_max_weight(weights, 0.20)  # Clamp to 20% max
weights = weights / weights.sum()  # Final normalize

# Always validate output
assert abs(weights.sum() - 1.0) < 1e-6, "Weights don't sum to 1!"
assert weights.isna().sum() == 0, "Weights contain NaN!"
```

**Where to Check**: `app/services/portfolio_constructor.py` `_normalize_weights_for_output()` method

---

### Problem 4: `Backtest suddenly underperforms` (different results than last run)

**Root Cause**: VAR diagnostics changed (new market conditions) or numerical instability.

**Diagnosis**:
```python
# Compare current vs. previous VAR run
import json
from pathlib import Path

# Latest diagnostics
diags = sorted(Path('data/processed/diagnostics').glob('*.json'))
if len(diags) > 1:
    with open(diags[-1]) as f:
        current = json.load(f)
    with open(diags[-2]) as f:
        previous = json.load(f)
    
    print(f"Previous condition number: {previous['condition_number']}")
    print(f"Current condition number: {current['condition_number']}")
    if current['condition_number'] > 1e6:
        print("⚠️ Covariance ill-conditioned in latest run")
```

**Fix**:
```python
# Option 1: Expand date range (more training data)
start_date = '2020-01-01'

# Option 2: Check for data issues
# Check market_data table for gaps or missing assets

# Option 3: Increase ridge lambda
from app.services.feature_engineer import PCOptions
opts = PCOptions(cov_ridge=0.01)  # Increase from default 1e-6
```

---

### Problem 5: `CORS error: No 'Access-Control-Allow-Origin'`

**Root Cause**: Frontend can't reach backend due to CORS policy.

**Diagnosis**: Browser DevTools → Console → red error

**Fix**: Backend already has CORS for localhost:*. Check:
```python
# app/main.py should have:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Problem 6: `yfinance rate limit` or `connection refused`

**Root Cause**: Too many requests in quick succession, or network blocked.

**Fix**:
```python
# DataFetcher has built-in delays
fetcher = DataFetcher()
# Automatically pauses 0.1s between symbol requests

# Or manual:
import time
for symbol in symbols:
    data = fetcher.fetch_ohlcv([symbol], start, end)
    time.sleep(0.1)  # Polite delay
```

---

## Key Files Reference

Quick lookup by task:

| Task | File | Method/Section |
|------|------|-----------------|
| Understand full pipeline | `scripts/walkforward_backtest.py` | main() function |
| Fix timezone issues | `app/services/data_fetcher.py` | `_normalize_yf_df()` |
| Modify weight selection | `app/services/portfolio_constructor.py` | `_project_to_long_only()`, `_clamp_max_weight()` |
| Add/tweak trading rules | `app/services/trade_signal_engine.py` | `generate_signal()` |
| Adjust backtest costs | `app/services/backtester.py` | `BacktestConfig` dataclass |
| View VAR diagnostics | `data/processed/diagnostics/diag_*.json` | JSON files |
| Add API route | `app/api/routes/*.py` | Follow existing patterns |
| Debug numerical issues | `app/services/feature_engineer.py` | `pipeline_var_cov()` |
| Database models | `app/models/database.py` | SQLAlchemy ORM |
| Request/response schemas | `app/models/schemas.py` | Pydantic models |

---

## Before Starting a Change: Checklist

1. **Will this preserve persisted diagnostics/artifacts?** — Don't silently delete `var_outputs/` or `portfolio_runs` entries
2. **Modifying VAR/covariance logic?** → Test on 3-5 symbols first; inspect VAR diagnostics
3. **Changing DB schema?** → Discuss migration plan with maintainer
4. **Date operations?** → Ensure UTC consistency end-to-end
5. **New feature?** → Add to `FeatureConfig` dataclass; persist to `data/processed/{SYMBOL}_features.parquet`

---

## Summary

This guide provides:
- **Big Picture**: 5-stage data pipeline with persistence
- **Workflows**: Copy-paste commands for common tasks
- **Patterns**: 6 non-negotiable rules (timezones, price columns, VAR, weights, signals, backtesting)
- **Architecture**: Service dependencies, API orchestration
- **Debugging**: 6 hot spots with diagnosis + fixes
- **Reference**: Key files by task

For API documentation, see `http://localhost:8000/docs` (Swagger UI) or `app/models/schemas.py`.

For AI agent guidance, see `.github/copilot-instructions.md`.
