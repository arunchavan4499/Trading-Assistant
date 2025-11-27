# Quick Start Guide - Quant Trading Frontend

## Prerequisites

- **Node.js** 18+ (https://nodejs.org/)
- **npm** 9+ (comes with Node.js)
- **Backend server** running on `http://localhost:8000`

## Installation Steps

### 1. Navigate to Frontend Directory

```powershell
cd c:\Users\ARUN\OneDrive\Desktop\MP\quant_trade_MP\frontend
```

### 2. Install Dependencies

```powershell
npm install
```

This will install all required packages:
- React 18.2 + React DOM
- TypeScript 5.3
- Vite 5.0
- Tailwind CSS 3.4
- @tanstack/react-query 5.17
- React Router DOM 6.21
- Recharts 2.10
- Axios 1.6
- Lucide React (icons)
- Radix UI primitives (shadcn/ui dependencies)

**Expected installation time**: 2-3 minutes

### 3. Create Environment File (Optional)

```powershell
Copy-Item .env.example .env
```

Or manually create `.env` file:
```env
VITE_API_URL=http://localhost:8000
```

### 4. Start Development Server

```powershell
npm run dev
```

**Output:**
```
VITE v5.0.10  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Open browser**: http://localhost:3000

### 5. Verify Backend Connection

The frontend expects the backend API to be running on port 8000. Verify backend is up:

```powershell
# In a separate terminal, navigate to project root
cd c:\Users\ARUN\OneDrive\Desktop\MP\quant_trade_MP

# Run health check
python scripts/health_check.py
```

**Expected output:**
```
✓ Database connection successful
✓ Market data table exists
✓ All services loaded
```

## Troubleshooting

### Issue: `npm install` fails with network errors
**Solution**: 
```powershell
npm cache clean --force
npm install
```

### Issue: Port 3000 already in use
**Solution**: Kill existing process or change port in `vite.config.ts`:
```typescript
server: {
  port: 3001, // Use different port
  ...
}
```

### Issue: TypeScript errors after install
**Solution**: Restart VS Code or run:
```powershell
npm run build  # Verify no compilation errors
```

### Issue: API calls fail with CORS errors
**Solution**: 
1. Verify backend is running on port 8000
2. Check Vite proxy config in `vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true
  }
}
```

### Issue: Dark mode not applying
**Solution**: Clear browser localStorage:
```javascript
// In browser console
localStorage.clear()
location.reload()
```

## Development Workflow

### Hot Module Replacement (HMR)
Vite enables instant updates without full page reload. Edit any `.tsx` file and see changes immediately.

### React Query DevTools
Auto-enabled in development mode. Click the React Query icon (bottom-left) to inspect:
- Active queries
- Cache status
- Refetch behavior

### Linting
```powershell
npm run lint  # Check for TypeScript/ESLint errors
```

### Production Build
```powershell
npm run build  # Creates optimized bundle in dist/
npm run preview  # Preview production build locally
```

## Project Structure Overview

```
frontend/
├── src/
│   ├── api/              # 7 API service modules
│   ├── components/       # UI components (15+ files)
│   │   ├── ui/           # shadcn base components
│   │   ├── cards/        # StatCard, SignalCard
│   │   ├── charts/       # LineChart, CandlestickChart, Heatmap
│   │   ├── tables/       # PortfolioTable, RebalanceTable
│   │   └── loaders/      # Loader, ErrorDisplay
│   ├── context/          # ThemeProvider
│   ├── hooks/            # useApi (React Query hooks)
│   ├── layouts/          # DashboardLayout
│   ├── pages/            # 8 pages (Dashboard, MarketData, etc.)
│   ├── router/           # AppRouter
│   ├── types/            # TypeScript interfaces
│   └── lib/              # Utilities
├── public/               # Static assets
└── [config files]        # vite.config.ts, tailwind.config.js, etc.
```

## Next Steps

1. **Explore Dashboard** (http://localhost:3000) - Overview of portfolio metrics
2. **Fetch Market Data** (/market-data) - Load OHLCV data for symbols
3. **Construct Portfolio** (/portfolio) - Run sparse mean-reverting optimization
4. **Generate Signals** (/signals) - Create rebalancing trades
5. **Run Backtest** (/backtester) - Simulate strategy performance
6. **Monitor Risk** (/risk) - Track drawdown and exposure

## Common Tasks

### Add New Page
1. Create `src/pages/NewPage/index.tsx`
2. Add route in `src/router/AppRouter.tsx`
3. Add nav item in `src/layouts/DashboardLayout.tsx`

### Add New API Endpoint
1. Add function to relevant `src/api/*.ts` file
2. Create custom hook in `src/hooks/useApi.ts`
3. Use hook in page component

### Add New Component
```powershell
# Using shadcn CLI (if needed)
npx shadcn-ui@latest add dialog  # Example: add Dialog component
```

### Update Theme Colors
Edit `src/index.css` CSS variables:
```css
:root {
  --primary: 222.2 47.4% 11.2%;  /* HSL values */
  --secondary: 210 40% 96.1%;
  ...
}
```

## Getting Help

- **Frontend README**: `frontend/README.md`
- **Backend Copilot Instructions**: `.github/copilot-instructions.md`
- **TypeScript Types**: `frontend/src/types/index.ts`
- **API Endpoints**: `frontend/src/api/*.ts`

---

**Status**: ✅ All 8 pages implemented, ready for development

**Last Updated**: 2024
