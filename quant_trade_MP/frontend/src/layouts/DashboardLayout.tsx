import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeProvider';
import { ToastContainer } from '@/components/loaders/Toast';
import { Sidebar, SidebarItem } from '@/components/portfolio/Sidebar';
import { useBacktestRuns, usePortfolioRuns, useRiskStatus } from '@/hooks/useApi';
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Bell,
  BarChart3,
  Settings,
  Moon,
  Sun,
  Menu,
  FlaskConical,
} from 'lucide-react';

export function DashboardLayout() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: portfolioRuns } = usePortfolioRuns();
  const { data: backtestRuns } = useBacktestRuns();
  const { data: riskStatus } = useRiskStatus();

  const navItems: SidebarItem[] = [
    { title: 'Dashboard', href: '/', icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: 'Market Data', href: '/market-data', icon: <TrendingUp className="h-5 w-5" /> },
    {
      title: 'Portfolio Constructor',
      href: '/portfolio',
      icon: <Briefcase className="h-5 w-5" />,
      badge: portfolioRuns?.length,
    },
    {
      title: 'Backtester',
      href: '/backtester',
      icon: <BarChart3 className="h-5 w-5" />,
      badge: backtestRuns?.length,
    },
    {
      title: 'Signals',
      href: '/signals',
      icon: <Bell className="h-5 w-5" />,
      badge: riskStatus?.violations?.length,
    },
    { title: 'Research', href: '/features', icon: <FlaskConical className="h-5 w-5" /> },
    { title: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex min-h-screen text-slate-900 bg-slate-100 dark:text-slate-100 dark:bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.15),_transparent_55%),linear-gradient(180deg,#0B1220_0%,#0E1A2B_100%)]">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[260px] flex-col border-r border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/40 dark:shadow-[0_0_30px_rgba(15,23,42,0.6)] h-screen sticky top-0">
        <Sidebar items={navItems} activePath={location.pathname} theme={theme} toggleTheme={toggleTheme} />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              className="rounded-lg p-2 text-slate-700 transition-colors duration-200 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="font-satoshi text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Quant Suite</p>
              <h2 className="font-clash text-lg font-bold text-slate-900 dark:text-white">Trading Desk</h2>
            </div>
          </div>
          <Button
            variant="outline"
            className="rounded-lg border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Mobile Slide-over Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 w-80 max-w-full border-r border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950/60">
            <Sidebar
              items={navItems}
              activePath={location.pathname}
              onNavigate={() => setMobileOpen(false)}
              showClose
              onClose={() => setMobileOpen(false)}
              theme={theme}
              toggleTheme={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
                setMobileOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
