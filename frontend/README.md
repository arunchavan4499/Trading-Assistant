# Quant Trading Assistant - Frontend

React TypeScript frontend for quantitative trading portfolio management system with sparse optimization, mean-reversion strategies, and comprehensive backtesting.

## Tech Stack

- **Vite 5.0** - Fast build tool with HMR
- **React 18.2** - UI framework
- **TypeScript 5.3** - Type safety
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - Headless component library
- **React Query 5** - Data fetching & caching
- **React Router 6** - Client-side routing
- **Recharts 2** - Financial charts & visualizations
- **Lucide React** - Icon library

## Features

### 📊 Market Data
- OHLCV data fetching from yfinance
- Candlestick charts with volume
- Asset correlation heatmaps

### 🔧 Feature Engineering
- Technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, ATR)
- VAR(1) model diagnostics
- Feature correlation analysis

### 📈 Portfolio Construction
- Sparse mean-reverting portfolio optimization
- Box-Tiao decomposition (VAR-based)
- Ridge regularization with adaptive lambda
- Portfolio weight visualization
- Covariance matrix heatmap

### 🔔 Trade Signals
- Mean-reversion signal generation
- Rebalance plan with BUY/SELL/HOLD indicators
- Deviation threshold monitoring (default 2%)

### 🎯 Backtesting
- Walk-forward backtesting framework
- Realistic transaction costs (commission + slippage)
- Equity curve & drawdown charts
- Performance metrics (Sharpe ratio, annual return, max DD)

### 🛡️ Risk Management
- Real-time drawdown monitoring (30s polling)
- Position size limits
- Risk breach alerts
- Exposure breakdown by asset

### 📁 Reports
- Backtest run history
- Downloadable results (JSON/CSV)
- Aggregate performance statistics

### ⚙️ Settings
- User profile management
- Risk tolerance configuration
- Default portfolio parameters

## Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# Build for production
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API service layer (7 modules)
│   │   ├── client.ts     # Axios instance with auth interceptor
│   │   ├── marketData.ts # OHLCV data fetching
│   │   ├── features.ts   # Feature engineering endpoints
│   │   ├── portfolio.ts  # Portfolio construction
│   │   ├── signals.ts    # Trade signal generation
│   │   ├── backtest.ts   # Backtesting endpoints
│   │   ├── risk.ts       # Risk management
│   │   └── user.ts       # User management
│   ├── components/
│   │   ├── ui/           # shadcn/ui base components
│   │   ├── cards/        # StatCard, SignalCard
│   │   ├── charts/       # LineChart, CandlestickChart, Heatmap, PortfolioWeightsChart
│   │   ├── tables/       # PortfolioTable, RebalanceTable
│   │   └── loaders/      # Loader, ErrorDisplay
│   ├── context/
│   │   └── ThemeProvider.tsx  # Dark/light theme management
│   ├── hooks/
│   │   └── useApi.ts     # React Query custom hooks
│   ├── layouts/
│   │   └── DashboardLayout.tsx  # Sidebar navigation
│   ├── pages/            # 8 page components
│   │   ├── Dashboard/
│   │   ├── MarketData/
│   │   ├── Features/
│   │   ├── Portfolio/
│   │   ├── Signals/
│   │   ├── Backtester/
│   │   ├── Risk/
│   │   ├── Reports/
│   │   └── Settings/
│   ├── router/
│   │   └── AppRouter.tsx # Route configuration
│   ├── types/
│   │   └── index.ts      # TypeScript interfaces
│   ├── lib/
│   │   └── utils.ts      # cn() helper for classnames
│   ├── main.tsx          # App entry point
│   └── index.css         # Tailwind + theme variables
├── public/               # Static assets
├── .env.example          # Environment variables template
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies & scripts
```

## Environment Variables

Create `.env` file in `frontend/` directory:

```env
# Backend API base URL (proxy configured in vite.config.ts)
VITE_API_URL=http://localhost:8000
```

## API Proxy Configuration

The Vite dev server proxies `/api/*` requests to the backend server (default: `http://localhost:8000`). This avoids CORS issues during development.

**Vite config snippet:**
```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true
    }
  }
}
```

## Key Conventions

### 1. Data Flow
- All API calls use React Query hooks from `useApi.ts`
- `staleTime: 5 minutes` - data cached for 5min before refetch
- `refetchOnWindowFocus: false` - prevents over-fetching
- Mutations auto-invalidate relevant queries on success

### 2. Type Safety
- All API responses typed via `types/index.ts` interfaces
- Matches Python backend data structures (OHLCVData, PCOptions, RebalancePlan, etc.)
- TypeScript strict mode enabled

### 3. Theme System
- Dark/light/system modes via `ThemeProvider`
- CSS variables in `index.css` (HSL color scheme)
- shadcn/ui components auto-adapt to theme

### 4. Component Patterns
- **Pages** use layout components (DashboardLayout wrapper)
- **Charts** use Recharts with responsive containers
- **Tables** use shadcn Table primitives
- **Loading states** via PageLoader + React Query `isLoading`
- **Error states** via ErrorDisplay with retry button

### 5. Authentication
- `apiClient` (axios) includes Bearer token interceptor
- Token stored in localStorage (key: `auth_token`)
- 401 responses auto-logout and redirect to login

## Available Scripts

```bash
# Start dev server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint TypeScript/React code
npm run lint
```

## Backend Integration

The frontend expects the following backend endpoints (as defined in `app/services/`):

| Endpoint | Method | Service Module |
|----------|--------|----------------|
| `/api/market-data/fetch` | POST | data_fetcher.py |
| `/api/portfolio/construct` | POST | portfolio_constructor.py |
| `/api/signals/generate` | POST | trade_signal_engine.py |
| `/api/backtest/run` | POST | backtester.py |
| `/api/risk/status` | GET | risk_manager.py |
| `/api/portfolio/runs` | GET | portfolio_constructor.py |
| `/api/backtest/runs` | GET | backtester.py |
| `/api/user` | GET/PUT | user management |

**Backend must be running on port 8000** before starting frontend dev server.

## Development Workflow

1. **Start backend**: `cd .. && python scripts/health_check.py` (verify DB + services)
2. **Start frontend**: `npm run dev` (auto-opens http://localhost:3000)
3. **Make changes**: Vite HMR reloads instantly
4. **Test API calls**: Use React Query DevTools (auto-enabled in dev mode)
5. **Inspect errors**: Check browser console + Network tab

## Production Deployment

```bash
# Build optimized bundle
npm run build

# Output: dist/ directory (static files)
# Serve with Nginx/Caddy/Vercel/Netlify
```

### Example Nginx config:
```nginx
server {
  listen 80;
  server_name your-domain.com;
  root /path/to/frontend/dist;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  location /api {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
  }
}
```

## Troubleshooting

### Issue: TypeScript errors on first install
**Solution**: Run `npm install` - errors are expected pre-installation (missing React/deps).

### Issue: API calls return 404
**Solution**: Verify backend is running on port 8000; check Vite proxy config.

### Issue: Dark mode not working
**Solution**: Clear localStorage; verify `ThemeProvider` wraps `<App />` in `main.tsx`.

### Issue: Charts not rendering
**Solution**: Check console for Recharts errors; ensure data format matches expected types.

### Issue: React Query not refetching
**Solution**: Check `staleTime` (5min default); use `refetch()` manually or reduce staleTime.

## Contributing

1. Follow TypeScript strict mode (no `any` types)
2. Use functional components with hooks (no class components)
3. Maintain consistent naming: `camelCase` files, `PascalCase` components
4. Add types for all API responses in `types/index.ts`
5. Use shadcn/ui components for consistency

## License

MIT License - See root `LICENSE` file for details.

---

**Built with ❤️ for quantitative traders**
