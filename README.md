# 📊 Quant Trading Assistant

A modern quantitative trading system designed to generate trading signals, optimize portfolios, and perform backtesting using statistical and machine learning techniques.

---

## 🚀 Features

- Portfolio optimization using sparse mean-reversion strategies  
- Machine learning-enhanced signal generation  
- Backtesting with walk-forward simulation  
- Risk management with drawdown and position limits  
- Technical indicators (SMA, RSI, MACD, ATR)  
- REST API for full system interaction  
- Interactive frontend dashboard  

---

## 🧠 Core Workflow

- Fetch and process market data (OHLCV)
- Engineer features using technical indicators + VAR model
- Construct optimized portfolios (Box-Tiao method)
- Generate trading signals (BUY / SELL / HOLD)
- Backtest strategies with realistic costs
- Evaluate performance (Sharpe ratio, drawdown)

---

## 🛠️ Technical Details

- Backend: Python + FastAPI  
- Frontend: React + TypeScript + Tailwind CSS  
- Database: SQLite / PostgreSQL (pgvector support)  
- Data Source: yfinance  
- Architecture: Modular service-based system  
- API: RESTful endpoints  

---

## ⚡ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/your-repo.git
cd QuantTrade_AI
```

### 2. Start Backend
```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -r requirements-server.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Open Application
http://localhost:3000

---

## 📁 Directory Structure

```
QuantTrade_AI/
├── app/
├── frontend/
├── scripts/
├── data/
├── results/
├── README.md
└── TECHNICAL_GUIDE.md
```

---

## ⚙️ Configuration

Create a `.env` file:

```
DATABASE_URL=sqlite:///./test.db
```

For production:

```
DATABASE_URL=postgresql://user:password@localhost/quant_trading
```

---

## 🧪 Testing

```bash
python scripts/verify_integration.py
python scripts/walkforward_backtest.py
python scripts/health_check.py
```

---

## 🌐 API Endpoints

- Market Data → `/api/data/*`  
- Portfolio → `/api/portfolio/*`  
- Features → `/api/features/*`  
- Signals → `/api/signals/*`  
- Backtest → `/api/backtest/*`  
- Risk → `/api/risk/*`  

---

## 📊 Project Status

- Backend: ✅ Complete  
- API: ✅ Complete  
- Frontend: ⚠️ In Progress  
- Testing: ⚠️ Partial  

---

## 🛠️ Troubleshooting

- Backend not starting → Check port 8000  
- API connection issues → Verify backend is running  
- Data errors → Validate ticker symbols  
- Model instability → Increase data or adjust parameters  

---

## 📚 Documentation

- API Docs: http://localhost:8000/docs  
- Technical Guide: TECHNICAL_GUIDE.md  

---

## 🚀 Future Improvements

- Complete frontend integration  
- Improve error handling  
- Add authentication system  
- Deploy using Docker  

---

## 📜 License

This project is for educational and research purposes.

---

Created with ❤️ for quantitative trading
