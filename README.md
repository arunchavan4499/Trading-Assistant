# 📊 Quant Trading Assistant

A professional-grade quantitative trading platform that combines portfolio optimization, machine learning-enhanced feature engineering, and robust backtesting capabilities. This system generates actionable trading signals and constructs optimal mean-reverting portfolios.

---

## 🏗️ Project Architecture

The project follows a modular service-oriented architecture designed for scalability and research flexibility.

### Backend Services
| Service | Purpose |
| :--- | :--- |
| **DataFetcher** | Market data ingestion and normalization via `yfinance`. |
| **FeatureEngineer** | Technical indicator calculation and VAR state-space modeling. |
| **PortfolioConstructor** | Box-Tiao optimization and sparse portfolio selection. |
| **TradeSignalEngine** | Rule-based signal generation (Buy/Sell/Hold). |
| **Backtester** | Walk-forward strategy simulation with transaction costs. |
| **RiskManager** | Real-time drawdown and position limit enforcement. |

### Project Structure
- **`app/`**: FastAPI backend core logic and REST API endpoints.
- **`frontend/`**: Modern React + TypeScript + Vite dashboard.
- **`scripts/`**: Orchestration scripts for research and system verification.
- **`docs/`**: Detailed technical guides and manuals.
- **`tests/`**: Comprehensive backend test suite.

---

## 🚀 Quick Start (Plug-and-Play)

Follow these steps to get the system running on your local machine.

### 1. Prerequisites
- **Python**: 3.10+
- **Node.js**: 18.x+
- **Database**: SQLite (default) or PostgreSQL

### 2. Installation & Setup

#### Backend Setup
```powershell
# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure Environment
cp .env.example .env
```

#### Frontend Setup
```powershell
cd frontend
npm install
```

### 3. Running the System

To run the full application, start both the backend server and the frontend development server.

**Start Backend:**
```powershell
python start_server.py
```
*API available at: `http://localhost:8000` | Docs at: `/docs`*

**Start Frontend:**
```powershell
cd frontend
npm run dev
```
*Dashboard available at: `http://localhost:3000`*

---

## 🧪 Verification & Research

Verify system health or run research pipelines using the provided scripts:

```powershell
# Perform System Health Check
python scripts/health_check.py

# Verify Integration
python scripts/verify_integration.py

# Run Full Walk-Forward Backtest
python scripts/walkforward_backtest.py
```

---

## 📊 Project Status

- **Backend Logic**: ✅ 100% Complete
- **REST API**: ✅ 100% Complete
- **Frontend Dashboard**: ✅ 95% Complete
- **Integration Testing**: 🔄 In Progress

---

## 📚 Documentation
- **[Technical Guide](docs/TECHNICAL_GUIDE.md)**: Deep dive into the pipeline logic.
- **[Risk Control Guide](docs/RISK_CONTROL_GUIDE.md)**: Details on drawdown enforcement.
- **[Resources Index](docs/RESOURCES_INDEX.md)**: Index of all project resources.

---

## 📜 License
This project is for research and educational purposes. Use it at your own risk.

---

Created with ❤️ for Quantitative Trading Research.
