# Copilot Instructions for Quant Trading Assistant

## Big Picture: 5-Stage Pipeline with Persistence

**Quant Trading Assistant** is a quantitative trading system implementing a deterministic 5-stage data pipeline:
1. **Fetches market data** via yfinance (OHLCV) → stored in `market_data` DB table
2. **Engineers features** including VAR(1) model estimation (state-space A matrix + covariance) → saved to `data/processed/var_outputs/<ts>/` and `var_runs` table
3. **Constructs portfolios** using Box-Tiao decomposition (sparse eigenvector selection) → stored in `portfolio_runs` table
4. **Generates rebalance signals** via mean-reversion (portfolio deviation > 2% threshold)
5. **Backtests** with walk-forward windows, realistic costs (0.05% commission + 0.05% slippage) → outputs `results/backtest_report.json` + daily CSV

**Key Principle**: All intermediate outputs are **persisted** (diagnostics, matrices, weights). Each service is **stateless**—same inputs = same outputs. This enables re-running later stages without upstream recomputation.

---

## Critical Workflows (Copy-Paste Ready)

### Start Backend Dev Server
```powershell
cd a:\WD Projecs\Trading_Assistant\QuantTrade_AI
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
# Wait for: "Application startup complete"
```

### Run Full Walk-Forward Backtest
```powershell
# Fetches data, engineers features, builds portfolio, backtests
python scripts/walkforward_backtest.py
# Output: results/backtest_report.json + daily CSV
```

### Start Frontend (Dev)
```powershell
cd frontend
npm install  # first time only
npm run dev
# Vite proxies /api → http://localhost:8000; app at http://localhost:5173
```

### Inspect Diagnostics
```powershell
ls data/processed/diagnostics/  # VAR diagnostics (JSON)
ls data/processed/var_outputs/  # A matrices, covariance, standardized returns
```

---

## Project-Specific Patterns (Never Deviate)

### 1. **Timezones: Always UTC**
- `DatetimeIndex` must be **UTC-aware** (use `.tz_localize('UTC')` or `.tz_convert('UTC')`)
- `market_data` table: `DateTime(timezone=True)` column
- **Why**: Silent comparison bugs with naive datetimes across multi-source data

### 2. **Price Column: Prefer `adj_close`**
- Use `adj_close` (dividend/split adjusted) for all strategy logic
- `data_fetcher._normalize_yf_df()` handles fallback to `close`
- **Never override** this without discussion—affects portfolio returns

### 3. **VAR(1) Estimation: Standardize First**
- **All returns standardized to zero mean, unit variance** before VAR regression: `A @ R_t ≈ R_{t+1}`
- Use `sklearn.preprocessing.StandardScaler` fitted on training window
- Box-Tiao eigenvector computed on standardized returns, then weights denormalized

### 4. **Portfolio Weights: Always Normalized**
- Weights sum to ~1.0 (long-only); L1-normalized if long-short
- **Never leave NaN weights**; clamp + renormalize if calculation fails
- Sparse selection: pick top-K assets by **absolute eigenvector component**
- Helper functions in `portfolio_constructor.py`: `_project_to_long_only()`, `_clamp_max_weight()`

### 5. **Mean-Reversion Signal Logic** (in `trade_signal_engine.py`)
```python
deviation = (current_value - target_value) / target_value
if deviation > DEVIATION_THRESHOLD (2%):  # → SELL
elif deviation < -DEVIATION_THRESHOLD:    # → BUY
else:                                     # → HOLD
```

### 6. **Backtesting: Walk-Forward** (in `scripts/walkforward_backtest.py`)
- Training window: compute VAR + covariance **up to rebalance date (inclusive)**
- Weights held constant between rebalance dates; transaction costs: 0.05% commission + 0.05% slippage
- **Output**: `backtest_report.json` (summary) + daily CSV (returns, trades)

---

## Architecture: Services & Data Flow

| Service | Input | Output | Persistence |
|---------|-------|--------|-------------|
| `DataFetcher` | symbols, date range | aligned OHLCV | `market_data` DB |
| `FeatureEngineer` (VAR) | price DataFrame | standardized returns, A matrix, covariance | `var_outputs/<ts>/`, `var_runs` DB |
| `PortfolioConstructor` | covariance, prices | weights + metrics | `portfolio_runs` DB |
| `TradeSignalEngine` | target weights, current qty, prices | rebalance trades | none (pure compute) |
| `Backtester` | target weights, prices, initial capital | equity curve, trade log, metrics | `results/backtest_report.json` |

**API routes** (in `app/api/routes/`) chain services:
- `POST /api/portfolio/construct` → DataFetcher → FeatureEngineer → PortfolioConstructor
- `POST /api/signals/rebalance` → TradeSignalEngine
- `POST /api/backtest/run` → Backtester (reads weights from `portfolio_runs` or computes fresh)

---

## Configuration & Secrets

**`app/core/config.py`** (Pydantic BaseSettings):
```python
DATABASE_URL: str            # e.g., "sqlite:///./test.db" or PostgreSQL
DEFAULT_SPARSITY: int = 15   # K in Box-Tiao (top-K assets)
DEVIATION_THRESHOLD: float = 0.02  # 2% rebalance trigger
MAX_POSITION_SIZE: float = 0.20    # 20% per asset limit
```

**Env file pattern**: Create `.env` in project root (never commit):
```
DATABASE_URL=sqlite:///./test.db
```

---

## Database Schema (Key Tables)

```
market_data
  symbol, date, open, high, low, close, adj_close, volume
  → UNIQUE(symbol, date); indexed for fast lookups

portfolio_runs
  run_name, symbols (JSON), weights_json, method, metrics (JSON), created_at

var_runs
  symbols (JSON), run_name, run_id (timestamp), method, diagnostics (JSON), created_at
  → diagnostics includes: n_obs, used_ridge_lambda, condition_number, eigenvalues
```

**Pattern**: JSON columns for flexibility—avoid migrations when adding metrics.

---

## Before Starting a Change: Checklist

1. **Will this preserve persisted diagnostics/artifacts?** (Don't silently delete `var_outputs/` or `portfolio_runs` entries)
2. **Modifying VAR/covariance logic?** → Test on 3-5 symbols first; inspect VAR diagnostics
3. **Changing DB schema?** → Discuss migration plan with maintainer
4. **Date operations?** → Ensure UTC consistency end-to-end
5. **New feature?** → Add to `FeatureConfig` dataclass; persist to `data/processed/{SYMBOL}_features.parquet`

---

## Debugging Hot Spots

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| `TypeError: can't compare naive/aware datetime` | Missing `.tz_localize('UTC')` on DatetimeIndex | Check `_normalize_yf_df()` and all date operations |
| Singular matrix or ridge lambda → inf | Too few observations or perfect correlation | Reduce symbols, extend date range, or increase `cov_ridge` in `PCOptions` |
| Weights contain NaN or don't sum to 1.0 | Normalization failed in Box-Tiao selection | Inspect VAR diagnostics; check `_project_to_long_only()` |
| Backtest Sharpe suddenly drops | VAR diagnostics changed (condition number increased) | Compare current `var_runs` to prior; inspect covariance matrix condition |
| Frontend returns 404 on `/api/health` | Backend not running or CORS misconfigured | Verify backend on http://127.0.0.1:8000; check `allow_origins` in `app.main` |

---

## Frontend Integration Points

**Framework**: Vite 5 + React 18 + TypeScript  
**UI Library**: shadcn/ui (Tailwind CSS)  
**Data Fetching**: Axios + React Query (5-minute stale time)  
**Routing**: React Router  
**Pages**: Dashboard, Portfolio, MarketData, Features, Signals, Backtester, Risk, Reports, Settings  

**API Proxy** (`frontend/vite.config.ts`):
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    },
  },
},
```

**Request/Response Schema Contract** (`app/models/schemas.py`):
- All endpoints use Pydantic models for validation and documentation
- Coordinate frontend TypeScript types with backend schema changes
- Use Swagger UI (`http://localhost:8000/docs`) to verify endpoint contracts during development

---

## Quick Reference: Key Files by Task

| Task | File(s) |
|------|---------|
| Trace full pipeline logic | `scripts/walkforward_backtest.py` |
| Fix timezone bugs | `app/services/data_fetcher.py` → `_normalize_yf_df()` method |
| Modify weight selection algorithm | `app/services/portfolio_constructor.py` → Box-Tiao eigenvector logic |
| Tweak trading signal rules | `app/services/trade_signal_engine.py` → `DEVIATION_THRESHOLD` logic |
| Adjust backtest costs | `app/services/backtester.py` → `BacktestConfig` class |
| Inspect VAR diagnostics | `data/processed/diagnostics/diag_*.json` |
| Add new API endpoint | `app/api/routes/*.py` → copy existing pattern, add schema to `app/models/schemas.py` |
| Update frontend pages | `frontend/src/pages/*/index.tsx` → replace mock data with Axios calls |
| Test backend services | `scripts/verify_integration.py` or `test_*.py` files in root |
