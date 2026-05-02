import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface SidebarItem {
    title: string;
    href: string;
    icon: ReactNode;
    badge?: number;
}

interface SidebarProps {
    items: SidebarItem[];
    activePath: string;
    onNavigate?: () => void;
    showClose?: boolean;
    onClose?: () => void;
    theme: string;
    toggleTheme: () => void;
}

export function Sidebar({
    items,
    activePath,
    onNavigate,
    showClose,
    onClose,
    theme,
    toggleTheme,
}: SidebarProps) {
    return (
        <div className="flex h-full flex-col bg-white backdrop-blur-2xl dark:bg-slate-950/40">
            <div className="border-b border-slate-200 px-6 py-6 bg-gradient-to-b from-slate-50/70 to-transparent dark:border-white/10 dark:from-slate-900/70">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="font-satoshi text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Quant Suite</p>
                        <h1 className="tracking-[0.030em] font-clash mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100 ">Trading Desk</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Assistant</p>
                    </div>
                    {showClose && (
                        <button
                            aria-label="Close menu"
                            className="mt-1 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
                {items.map((item) => {
                    const isActive = activePath === item.href;
                    return (
                        <Link key={item.href} to={item.href} onClick={onNavigate}>
                            <div
                                className={cn(
                                    'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-gradient-to-r from-sky-100/80 to-indigo-100/60 text-sky-700 shadow-sm ring-1 ring-sky-300/40 dark:from-sky-500/35 dark:to-cyan-400/15 dark:text-white dark:shadow-[0_0_18px_rgba(56,189,248,0.45)] dark:ring-sky-400/40'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                                )}
                            >
                                <span className={cn('text-slate-400 transition-colors', isActive && 'text-sky-600 dark:text-cyan-200')}>
                                    {item.icon}
                                </span>
                                <span>{item.title}</span>
                                {typeof item.badge === 'number' && (
                                    <span className="ml-auto rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="px-4 pb-5 pt-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                    onClick={toggleTheme}
                >
                    {theme === 'dark' ? <Sun className="h-5 w-5 text-slate-400" /> : <Moon className="h-5 w-5 text-slate-400" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Button>
            </div>
        </div>
    );
}
