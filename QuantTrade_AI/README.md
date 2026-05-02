# 📊 Quant Trading Assistant

A sophisticated quantitative trading system that combines portfolio optimization, machine learning-enhanced feature engineering, and walk-forward backtesting. This platform generates actionable trading signals and constructs optimal sparse mean-reverting portfolios.

---

## 🚀 Quick Start (5 Minutes)

### 1. Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+
- **Database**: SQLite (default) or PostgreSQL

### 2. Start Backend
```powershell
cd QuantTrade_AI
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python start_server.py
```
*Alternative: `uvicorn app.main:app --reload --port 8000`*

### 3. Start Frontend
```powershell
cd frontend
npm install
npm run dev
```
*Access the dashboard at: `http://localhost:3000`*

---

## 📋 Key Features

- **Automated Data Pipeline**: Seamless fetching and normalization of OHLCV data via `yfinance`.
- **Advanced Feature Engineering**: Technical indicators (SMA, RSI, MACD, ATR) combined with VAR(1) state-space modeling.
- **Portfolio Optimization**: Construction of sparse mean-reversion portfolios using Box-Tiao decomposition.
- **Signal Engine**: Automated BUY/SELL/HOLD signal generation with configurable rebalance thresholds.
- **Walk-Forward Backtester**: Realistic simulation including transaction costs (commission + slippage).
- **Risk Management**: Real-time monitoring of drawdown limits and position sizing constraints.

---

## 📁 Project Structure

The project has been cleaned and reorganized for a professional development workflow:

```text
quant_trade_MP/
├── app/                # FastAPI Backend
│   ├── api/            # REST API Routes (13 endpoints)
│   ├── core/           # Configuration & Settings
│   ├── models/         # Database & Pydantic Schemas
│   └── services/       # Core Pipeline Logic (7 services)
├── frontend/           # React + TypeScript Dashboard
├── scripts/            # Orchestration & Utility Scripts
│   ├── debug/          # Diagnostic & Debugging Utilities
│   └── ...             # Pipeline & Verification Scripts
├── tests/              # Comprehensive Test Suite
├── docs/               # Technical Guides & Manuals
├── data/               # Market Data & Processed Artifacts
└── results/            # Backtest Reports & Equity Curves
```

---

## 🏗️ Core Architecture

### Backend Services
| Service | Purpose |
| :--- | :--- |
| **DataFetcher** | Market data ingestion and normalization. |
| **FeatureEngineer** | Indicator calculation and VAR estimation. |
| **PortfolioConstructor** | Box-Tiao optimization and weight selection. |
| **TradeSignalEngine** | Rule-based signal generation. |
| **Backtester** | Walk-forward strategy simulation. |
| **RiskManager** | Drawdown and position limit enforcement. |

### API Reference
Full API documentation is available at `http://localhost:8000/docs` via Swagger UI.

| Category | Endpoint |
| :--- | :--- |
| **Market Data** | `/api/data/fetch`, `/api/data/ohlcv` |
| **Portfolio** | `/api/portfolio/construct`, `/api/portfolio/runs` |
| **Signals** | `/api/signals/rebalance`, `/api/signals/simple` |
| **Risk** | `/api/risk/status` |

---

## ⚙️ Configuration

Create a `.env` file in the `QuantTrade_AI` root:

```env
# Database Configuration
DATABASE_URL=sqlite:///./data/app.db

# Example PostgreSQL (Optional)
# DATABASE_URL=postgresql://user:password@localhost:5432/quant_trade
```

Key system parameters can be adjusted in `app/core/config.py`:
- `DEFAULT_SPARSITY`: Number of assets in the optimized portfolio.
- `DEVIATION_THRESHOLD`: Rebalance trigger (Default: 2%).
- `MAX_POSITION_SIZE`: Max weight per asset (Default: 20%).

---

## 🧪 Testing & Verification

To ensure the system is correctly integrated and healthy:

```powershell
# Verify Backend-Frontend Connection
python scripts/verify_integration.py

# Run Full Walk-Forward Backtest
python scripts/walkforward_backtest.py

# Perform System Health Check
python scripts/health_check.py
```

---

## 📚 Documentation

For more in-depth information, please refer to the files in the `docs/` directory:
- **[TECHNICAL_GUIDE.md](docs/TECHNICAL_GUIDE.md)**: Deep dive into the architecture and pipeline logic.
- **[RISK_CONTROL_GUIDE.md](docs/RISK_CONTROL_GUIDE.md)**: Details on drawdown and risk enforcement.
- **[RESOURCES_INDEX.md](docs/RESOURCES_INDEX.md)**: Index of all available technical resources.

---

**Current Status**:
- Backend: ✅ 100% Complete
- API: ✅ 100% Complete
- Frontend UI: ✅ 95% Complete
- Integration: 🔄 In Progress

Created with ❤️ for Quantitative Trading Research.
