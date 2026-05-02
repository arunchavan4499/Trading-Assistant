import { cn } from '@/lib/utils';

export interface RiskRow {
    symbol: string;
    name: string;
    weight: string;
    volatility: string;
    risk: 'HIGH' | 'MEDIUM' | 'LOW';
    pl: string;
    plPercent: string;
    plIsPositive: boolean;
    signal: string;
}

const riskStyles = {
    HIGH: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/40',
    MEDIUM: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-400/40',
    LOW: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/40',
};

interface RiskTableProps {
    rows: RiskRow[];
}

export function RiskTable({ rows }: RiskTableProps) {
    return (
        <div className="h-full rounded-2xl bg-slate-100 p-[1px] dark:bg-slate-950 dark:bg-gradient-to-r dark:from-indigo-500/30 dark:via-sky-500/15 dark:to-cyan-400/25">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_0_30px_rgba(59,130,246,0.2)] dark:backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-clash text-lg font-semibold text-slate-900 dark:text-white ">Risk & Allocation</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Current exposure breakdown</p>
                    </div>
                    <button className="rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-1 text-xs font-semibold text-sky-600 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-100 dark:shadow-[0_0_12px_rgba(56,189,248,0.35)]">
                        View Portfolio
                    </button>
                </div>

                <div className="mt-4 space-y-3">
                    {rows.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                            No allocation data available yet.
                        </div>
                    ) : (
                        rows.map((row) => (
                            <div
                                key={row.symbol}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 dark:text-white">{row.symbol}</p>
                                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{row.name}</p>
                                    </div>
                                    <span className={cn('ml-2 shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold', riskStyles[row.risk])}>
                                        {row.risk}
                                    </span>
                                </div>
                                <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                                    <div>
                                        <p className="text-slate-500  dark:text-slate-400 " >Weight</p>
                                        <p className="  font-medium text-slate-700 dark:text-slate-200">{row.weight}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400">Vol</p>
                                        <p className="font-medium text-slate-700 dark:text-slate-200">{row.volatility}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400">P/L</p>
                                        <p className={cn('font-semibold', row.plIsPositive ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300')}>
                                            {row.pl}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400">Signal</p>
                                        <p className="font-medium text-slate-700 dark:text-slate-200">{row.signal}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
