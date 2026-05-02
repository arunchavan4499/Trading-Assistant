import { useMemo, useState } from 'react';
import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface EquityPoint {
    date: string;
    portfolio: number;
    sp500: number;
}

const ranges = ['1W', '1M', '6M', 'YTD', 'ALL'] as const;

interface EquityChartProps {
    data: EquityPoint[];
}

function formatCurrency(value: number) {
    return `$${value.toLocaleString()}`;
}

function EquityTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const portfolio = payload.find((item: any) => item.dataKey === 'portfolio');
    const sp500 = payload.find((item: any) => item.dataKey === 'sp500');
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-200 dark:shadow-[0_0_20px_rgba(59,130,246,0.25)] dark:backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
            <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500 dark:text-slate-300">Portfolio</span>
                    <span className="font-semibold text-sky-600 dark:text-sky-200">{formatCurrency(portfolio?.value ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500 dark:text-slate-300">S&P 500</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-200">{formatCurrency(sp500?.value ?? 0)}</span>
                </div>
            </div>
        </div>
    );
}

export function EquityChart({ data }: EquityChartProps) {
    const [activeRange, setActiveRange] = useState<(typeof ranges)[number]>('6M');
    const hasData = data.length > 0;

    const rangedData = useMemo(() => {
        if (activeRange === 'ALL') return data;
        const sliceMap = { '1W': 7, '1M': 30, '6M': 120, YTD: 200 } as const;
        const size = sliceMap[activeRange];
        return data.slice(Math.max(data.length - size, 0));
    }, [activeRange, data]);

    return (
        <div className="h-full rounded-2xl bg-slate-100 p-[1px] dark:bg-slate-950 dark:bg-gradient-to-r dark:from-sky-500/30 dark:via-cyan-400/15 dark:to-indigo-500/30">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_0_30px_rgba(59,130,246,0.2)] dark:backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="font-clash text-lg font-semibold text-slate-900 dark:text-white tracking-[0.030em]">Equity Curve</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Portfolio value over time</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/5">
                        {ranges.map((range) => (
                            <button
                                key={range}
                                className={cn(
                                    'rounded-full px-3 py-1 text-xs font-semibold transition-all',
                                    activeRange === range
                                        ? 'bg-sky-500/30 text-sky-700 shadow-sm dark:text-white dark:shadow-[0_0_10px_rgba(56,189,248,0.35)]'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                                )}
                                onClick={() => setActiveRange(range)}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 min-h-[320px] flex-1">
                    {hasData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={rangedData} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={formatCurrency}
                                    axisLine={false}
                                    tickLine={false}
                                    width={70}
                                />
                                <Tooltip content={<EquityTooltip />} cursor={{ stroke: '#38bdf8', strokeDasharray: '4 6' }} />
                                <Line
                                    type="monotone"
                                    dataKey="portfolio"
                                    stroke="#60a5fa"
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sp500"
                                    stroke="#22d3ee"
                                    strokeWidth={2}
                                    dot={false}
                                    strokeDasharray="6 6"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                            No equity data available.
                        </div>
                    )}
                </div>

                {hasData && (
                    <div className="mt-4 flex items-center gap-6 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-6 rounded-full bg-sky-400" />
                            Portfolio Value
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-6 rounded-full bg-cyan-300" />
                            S&P 500
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
