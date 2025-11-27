import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeProvider';
import { ToastContainer } from '@/components/loaders/Toast';
import {
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  Briefcase,
  Bell,
  BarChart3,
  Shield,
  FileText,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Market Data', href: '/market-data', icon: <TrendingUp className="h-5 w-5" /> },
  { title: 'Features', href: '/features', icon: <Sparkles className="h-5 w-5" /> },
  { title: 'Portfolio', href: '/portfolio', icon: <Briefcase className="h-5 w-5" /> },
  { title: 'Signals', href: '/signals', icon: <Bell className="h-5 w-5" /> },
  { title: 'Backtester', href: '/backtester', icon: <BarChart3 className="h-5 w-5" /> },
  { title: 'Risk', href: '/risk', icon: <Shield className="h-5 w-5" /> },
  { title: 'Reports', href: '/reports', icon: <FileText className="h-5 w-5" /> },
  { title: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
];

export function DashboardLayout() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[240px] flex-col bg-card border-r border-border/50 shadow-lg">
        <div className="border-b border-border/50 px-6 py-8 bg-gradient-to-b from-primary/5 to-transparent">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quant Suite</p>
          <h1 className="mt-2 text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Trading Desk
          </h1>
          <p className="text-sm text-muted-foreground">Assistant</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.href} to={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/15 text-primary shadow-md'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-border/50 px-4 py-6">
          <Button
            variant="outline"
            className="w-full justify-start rounded-lg border-border/50"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed inset-x-0 top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border/50 shadow-lg">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              className="p-2 rounded-lg text-foreground hover:bg-primary/10 transition-colors duration-200"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quant Suite</p>
              <h2 className="text-lg font-bold text-foreground">Trading Desk</h2>
            </div>
          </div>
          <Button
            variant="outline"
            className="rounded-lg border-border/50"
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
          <div className="relative z-50 w-72 max-w-full bg-card shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quant Suite</p>
                <h3 className="text-lg font-bold text-foreground">Trading Desk</h3>
              </div>
              <button aria-label="Close menu" className="p-2 rounded-lg hover:bg-primary/10 transition-colors duration-200" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)}>
                    <div className={cn('flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200', isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-primary/10')}>
                      {item.icon}
                      <span>{item.title}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 py-6 border-t border-border/50">
              <Button
                variant="outline"
                className="w-full justify-start rounded-lg border-border/50"
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                  setMobileOpen(false);
                }}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
