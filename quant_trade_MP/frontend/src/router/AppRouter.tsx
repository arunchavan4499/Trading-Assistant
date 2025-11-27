import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Lazy load pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const MarketData = lazy(() => import('@/pages/MarketData'));
const Features = lazy(() => import('@/pages/Features'));
const Portfolio = lazy(() => import('@/pages/Portfolio'));
const Signals = lazy(() => import('@/pages/Signals'));
const Backtester = lazy(() => import('@/pages/Backtester'));
const Risk = lazy(() => import('@/pages/Risk'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="/market-data"
            element={
                <Suspense fallback={<div>Loading...</div>}>
                <MarketData />
                </Suspense>
            }
          />
          <Route
            path="/features"
            element={
                <Suspense fallback={<div>Loading...</div>}>
                <Features />
                </Suspense>
            }
          />
          <Route
            path="/portfolio"
            element={
                <Suspense fallback={<div>Loading...</div>}>
                <Portfolio />
                </Suspense>
            }
          />
          <Route
            path="/signals"
            element={
                <Suspense fallback={<div>Loading...</div>}>
                <Signals />
                </Suspense>
            }
          />
          <Route
            path="/backtester"
            element={
                <Suspense fallback={<div>Loading...</div>}>
                <Backtester />
                </Suspense>
            }
          />
          <Route
            path="/risk"
            element={
                <Suspense fallback={<div>Loading...</div>}>
                <Risk />
                </Suspense>
            }
          />
          <Route
            path="/reports"
            element={
                <Suspense fallback={<div>Loading...</div>}>
                <Reports />
                </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
                <Suspense fallback={<div>Loading...</div>}>
                <Settings />
                </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
