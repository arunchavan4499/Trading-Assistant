import { MetricCard } from './MetricCard';

interface PortfolioMetricsProps {
    expectedReturn: string;
    volatility: string;
    sharpeRatio: string;
    method: string;
}

export function PortfolioMetrics({ expectedReturn, volatility, sharpeRatio, method }: PortfolioMetricsProps) {
    return (
        <div className="h-full rounded-2xl bg-slate-100 p-[1px] dark:bg-slate-950 dark:bg-gradient-to-r dark:from-sky-500/30 dark:via-cyan-400/15 dark:to-indigo-500/25">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_0_20px_rgba(59,130,246,0.25)] dark:backdrop-blur-md">
                <h3 className="font-clash text-xl font-semibold tracking-[0.030em] text-slate-900 dark:text-white">Portfolio Metrics</h3>
                <p className="text-sm  leading-relaxed text-slate-500 dark:text-slate-400">Key portfolio performance indicators</p>

                <div className="mt-6 grid gap-4 md:grid-cols-2 tracking-[0.10em]">
                    <MetricCard label="Expected Return" value={expectedReturn} />
                    <MetricCard label="Portfolio Volatility" value={volatility} />
                    <MetricCard label="Sharpe Ratio" value={sharpeRatio} />
                    <div className="rounded-2xl bg-slate-100 p-[1px] dark:bg-slate-950 dark:bg-gradient-to-r dark:from-sky-500/30 dark:via-cyan-400/15 dark:to-indigo-500/25">
                        <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_0_20px_rgba(59,130,246,0.25)] dark:backdrop-blur-md">
                            <p className="font-satoshi text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Method</p>
                            <p className="font-clash mt-3 break-words text-lg font-semibold leading-snug text-slate-900 dark:text-white">{method}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
