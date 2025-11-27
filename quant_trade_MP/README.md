# Quant Trading Assistant

A sophisticated quantitative trading system that combines portfolio optimization, machine learning-enhanced signal generation, and backtesting capabilities to generate actionable trading signals and construct optimal portfolios.

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Python 3.10+
- Node.js 18+

### Start Backend
```powershell
cd a:\MP\quant_trade_MP
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -r requirements-server.txt
uvicorn app.main:app --reload --port 8000
```

Wait for: `Application startup complete`

### Start Frontend
```powershell
cd frontend
npm install
npm run dev
```

Wait for: `Local: http://localhost:3000/`

### Verify Connection
Open http://localhost:3000, then in DevTools Console (F12):
```javascript
fetch('/api/health').then(r=>r.json()).then(d=>console.log('Connected:', d))
```

---

## 📋 Project Overview

This project implements a comprehensive quantitative trading framework:

- **Fetch & Process Market Data** — Retrieve OHLCV from yfinance, normalize, store in DB
- **Engineer Features** — Technical indicators (SMA, RSI, MACD, ATR) + VAR(1) state-space model
- **Optimize Portfolios** — Sparse mean-reversion portfolios via Box-Tiao decomposition
- **Generate Trading Signals** — BUY/SELL/HOLD based on 2% portfolio deviation threshold
- **Backtest Strategies** — Walk-forward simulation with 0.05% commission + 0.05% slippage
- **Manage Risk** — Enforce 25% max drawdown, 20% per-asset position limits

---

## 🏗️ Architecture

### Core Services (Backend)
| Service | Purpose | Input | Output |
|---------|---------|-------|--------|
| **DataFetcher** | Fetch + normalize market data | Symbols, dates | OHLCV DataFrame |
| **FeatureEngineer** | Technical indicators + VAR(1) | Prices | Indicators, A matrix, covariance |
| **PortfolioConstructor** | Sparse weight optimization | Covariance matrix | Normalized weights |
| **TradeSignalEngine** | Mean-reversion signals | Target weights, prices | Rebalance trades |
| **Backtester** | Walk-forward simulation | Weights, prices, capital | Equity curve, metrics |
| **RiskManager** | Risk enforcement | Portfolio | Validation result |
| **PerformanceEvaluator** | Calculate metrics | Returns | Sharpe, max drawdown, etc. |

### REST API Endpoints (13 total)
**Market Data**: `/api/data/fetch`, `/api/data/ohlcv`, `/api/data/summary`  
**Portfolio**: `/api/portfolio/construct`, `/api/portfolio/runs`  
**VAR**: `/api/portfolio/var/run`, `/api/portfolio/var/runs`  
**Features**: `/api/features/compute`, `/api/features/correlation`  
**Signals**: `/api/signals/rebalance`, `/api/signals/simple`  
**Backtest**: `/api/backtest/run`, `/api/backtest/runs`  
**Risk**: `/api/risk/status`

### Frontend (React)
- **Pages**: Dashboard, Portfolio, MarketData, Features, Backtester, Risk, Signals, Reports, Settings
- **Stack**: Vite 5 + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **API Client**: Axios + React Query (5min caching)
- **Dev Proxy**: `/api` → `http://localhost:8000`

---

## 📁 Directory Structure

```
quant_trade_MP/
├── README.md                    ← Quick start + overview
├── TECHNICAL_GUIDE.md           ← Detailed architecture & conventions
├── .github/copilot-instructions.md
│
├── app/                         ← Backend FastAPI
│   ├── main.py                  ← App entry point
│   ├── core/config.py           ← Pydantic settings
│   ├── models/
│   │   ├── database.py          ← SQLAlchemy ORM
│   │   └── schemas.py           ← Request/response models
│   ├── services/                ← 7 core services
│   │   ├── data_fetcher.py
│   │   ├── feature_engineer.py
│   │   ├── portfolio_constructor.py
│   │   ├── trade_signal_engine.py
│   │   ├── backtester.py
│   │   ├── risk_manager.py
│   │   └── performance_evaluator.py
│   └── api/routes/              ← 13 REST endpoints
│
├── frontend/                    ← React + TypeScript
│   ├── src/
│   │   ├── pages/               ← 9 application pages
│   │   ├── api/                 ← Axios client modules
│   │   ├── hooks/               ← React Query hooks
│   │   ├── components/          ← Reusable UI components
│   │   └── styles/
│   ├── vite.config.ts           ← API proxy config
│   └── package.json
│
├── scripts/
│   ├── walkforward_backtest.py  ← Full pipeline execution
│   ├── verify_integration.py    ← Connection tests
│   ├── health_check.py
│   └── init_db.py
│
├── data/processed/
│   ├── var_outputs/             ← VAR matrices + outputs
│   └── diagnostics/             ← JSON diagnostics logs
│
└── results/
    ├── backtest_report.json     ← Summary metrics
    └── backtest_daily.csv       ← Daily equity curve
```

---

## 💾 Database Schema

### market_data
- `symbol` (str)
- `date` (DateTime, UTC)
- `open, high, low, close, adj_close` (float)
- `volume` (int)
- **Index**: UNIQUE(symbol, date)

### portfolio_runs
- `run_name` (str, unique)
- `symbols` (JSON array)
- `weights_json` (JSON) — {symbol → weight}
- `method` (str) — 'sparse_mean_reverting'
- `metrics` (JSON) — Sharpe ratio, expected return, variance

### var_runs
- `symbols` (JSON array)
- `run_name`, `run_id` (str)
- `method` (str) — 'pipeline_var_cov'
- `diagnostics` (JSON) — n_obs, condition_number, eigenvalues, ridge_lambda

### users
- `drawdown_limit` (float) — Default 0.25 (25%)
- `max_assets` (int) — Per-asset allocation max

---

## 🔧 Configuration

### Environment Setup

Create `.env` in project root (never commit):
```
DATABASE_URL=sqlite:///./test.db
```

For production (PostgreSQL):
```
DATABASE_URL=postgresql://user:password@localhost/quant_trading
```

### Key Settings (`app/core/config.py`)

```python
DEFAULT_SPARSITY: int = 15             # K in Box-Tiao (top-K assets)
DEVIATION_THRESHOLD: float = 0.02      # 2% rebalance trigger
MAX_POSITION_SIZE: float = 0.20        # 20% max per asset
DATA_START_DATE: str = "2020-01-01"
DATA_END_DATE: str = "2024-10-01"
```

---

## 🧪 Testing & Verification

### Automated Tests

```powershell
# Backend-frontend connection (5 tests)
python scripts/verify_integration.py

# Full walk-forward backtest
python scripts/walkforward_backtest.py

# System health check
python scripts/health_check.py
```

### Manual Testing (Browser Console)

```javascript
// Test 1: Health check
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Connected:', d))
  .catch(e => console.error('❌ Failed:', e))

// Test 2: Fetch market data
fetch('/api/data/fetch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbols: ['AAPL', 'MSFT'],
    start_date: '2024-01-01',
    end_date: '2024-11-22',
    save_to_db: true
  })
})
  .then(r => r.json())
  .then(d => console.log('Data:', d))
  .catch(e => console.error('Error:', e))

// Test 3: Construct portfolio
fetch('/api/portfolio/construct', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbols: ['AAPL', 'MSFT', 'GOOGL'],
    start_date: '2024-01-01',
    end_date: '2024-11-22',
    method: 'sparse_mean_reverting',
    sparsity_k: 3,
    max_weight: 0.5
  })
})
  .then(r => r.json())
  .then(d => console.log('Weights:', d.data.weights, 'Sharpe:', d.data.metrics.sharpe_ratio))
  .catch(e => console.error('Error:', e))
```

---

## 📊 Project Status

| Component | Status | % Complete |
|-----------|--------|-----------|
| Backend Services | ✅ Complete | 100% |
| REST API | ✅ Complete | 100% |
| Database | ✅ Complete | 100% |
| Frontend UI | ✅ Complete | 95% |
| API Integration | 🔄 In Progress | 30% |
| Testing | ⚠️ Partial | 40% |
| Error Handling | ⚠️ Partial | 50% |
| **Overall** | **70% Complete** | **70%** |

---

## 🛠️ Common Workflows

### Run Full Pipeline
```powershell
python scripts/walkforward_backtest.py
# Output: results/backtest_report.json + daily CSV
```

### Inspect VAR Diagnostics
```powershell
ls data/processed/diagnostics/
Get-Content data/processed/diagnostics/*.json | ConvertFrom-Json
```

### View API Documentation
```
http://localhost:8000/docs
```

### Check Backend Status
```powershell
curl http://localhost:8000/api/health
```

---

## 🐛 Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Backend won't start | Port 8000 in use | `taskkill /PID [pid] /F` then restart |
| Frontend can't reach API | Backend not running or wrong port | Check backend on 8000, verify CORS |
| Market data fails | yfinance blocked or invalid symbols | Check internet access, verify ticker symbols |
| VAR matrix singular | Too few observations or correlations | Use more data or fewer symbols, enable ridge |
| Weights contain NaN | Normalization failed | Check VAR diagnostics, increase ridge lambda |

---

## 📚 Detailed Documentation

For in-depth technical details, see **`TECHNICAL_GUIDE.md`**.

Sections included:
- **Big Picture**: 5-stage data pipeline with persistence
- **Critical Workflows**: Copy-paste commands for common tasks
- **Project-Specific Patterns**: 6 non-negotiable conventions
- **Architecture Deep Dive**: Service dependencies, API orchestration, persistence strategy
- **Database Schema**: Detailed table designs
- **Configuration**: Environment setup patterns
- **Debugging Hot Spots**: 6 common issues with diagnosis + fixes
- **Key Files**: Quick reference by task

---

## 🚀 Next Steps

1. **Verify Connection** — Run backend + frontend, test health endpoint
2. **Integrate Frontend** — Connect pages to API endpoints
3. **Add Error Handling** — Display API errors in UI
4. **Run Full Tests** — Test complete workflows end-to-end
5. **Deploy** — Docker + production database

For detailed guidance, see `TECHNICAL_GUIDE.md`.

---

## 📞 Resources

- **API Documentation**: `http://localhost:8000/docs` (Swagger UI)
- **Backend Code**: `app/services/`, `app/api/routes/`
- **Frontend Code**: `frontend/src/`
- **Technical Guide**: `TECHNICAL_GUIDE.md`
- **AI Agent Guide**: `.github/copilot-instructions.md`

---

**Status**: Backend 100% complete. Frontend integration in progress.

For questions or detailed information, check the resources above or review the relevant source files.
