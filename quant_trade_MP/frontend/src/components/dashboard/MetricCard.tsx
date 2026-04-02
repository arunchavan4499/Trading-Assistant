import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    title: string;
    value: string;
    change: string;
    changeLabel: string;
    isPositive?: boolean;
    icon: React.ReactNode;
    sparkline: number[];
    accent?: 'blue' | 'cyan' | 'indigo' | 'emerald';
}

const accentStyles = {
    blue: {
        outer: 'from-sky-500/40 via-cyan-400/20 to-indigo-500/35',
        glow: 'dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
        icon: 'from-sky-500/30 to-cyan-400/10',
        stroke: '#60a5fa',
    },
    cyan: {
        outer: 'from-cyan-400/35 via-sky-500/20 to-emerald-400/30',
        glow: 'dark:shadow-[0_0_20px_rgba(34,211,238,0.28)]',
        icon: 'from-cyan-400/30 to-sky-500/10',
        stroke: '#22d3ee',
    },
    indigo: {
        outer: 'from-indigo-500/35 via-sky-500/20 to-fuchsia-500/30',
        glow: 'dark:shadow-[0_0_20px_rgba(99,102,241,0.3)]',
        icon: 'from-indigo-500/30 to-sky-500/10',
        stroke: '#818cf8',
    },
    emerald: {
        outer: 'from-emerald-400/35 via-cyan-400/20 to-teal-400/30',
        glow: 'dark:shadow-[0_0_20px_rgba(16,185,129,0.25)]',
        icon: 'from-emerald-400/30 to-cyan-400/10',
        stroke: '#34d399',
    },
};

export function MetricCard({
    title,
    value,
    change,
    changeLabel,
    isPositive = true,
    icon,
    sparkline,
    accent = 'blue',
}: MetricCardProps) {
    const gradientId = useId().replace(/:/g, '');
    const styles = accentStyles[accent];
    const chartData = sparkline.map((point, index) => ({ index, value: point }));

    return (
        <div className={cn('rounded-2xl bg-slate-100 p-[1px] dark:bg-slate-950 dark:bg-gradient-to-r', styles.outer)}>
            <div
                className={cn(
                    'flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:backdrop-blur-xl dark:transition-transform dark:duration-200 dark:hover:-translate-y-0.5',
                    styles.glow
                )}
            >
                <div className="flex items-start justify-between">
                    <div>
                        <p className="font-satoshi text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                            {title}
                        </p>
                        <h3 className="font-clash mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{value}</h3>
                    </div>
                    <div
                        className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-gradient-to-br text-sky-600 dark:border-white/10 dark:text-cyan-100',
                            styles.icon
                        )}
                    >
                        {icon}
                    </div>
                </div>

                <div className="mt-4 flex items-end justify-between">
                    <div className="space-y-1">
                        <p className={cn('text-sm font-medium', isPositive ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300')}>
                            {change}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{changeLabel}</p>
                    </div>

                    <div className="h-12 w-24">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor={styles.stroke} stopOpacity={0.5} />
                                        <stop offset="100%" stopColor={styles.stroke} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={styles.stroke}
                                    strokeWidth={2}
                                    fill={`url(#${gradientId})`}
                                    fillOpacity={1}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
