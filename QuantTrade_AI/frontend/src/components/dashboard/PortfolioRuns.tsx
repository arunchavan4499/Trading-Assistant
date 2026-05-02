import { cn } from '@/lib/utils';

export interface PortfolioRunItem {
    id: string;
    name: string;
    description: string;
    performance: string;
    isPositive: boolean;
}

interface PortfolioRunsProps {
    runs: PortfolioRunItem[];
}

export function PortfolioRuns({ runs }: PortfolioRunsProps) {
    return (
        <div className="h-full rounded-2xl bg-slate-100 p-[1px] dark:bg-slate-950 dark:bg-gradient-to-r dark:from-cyan-400/30 dark:via-sky-500/15 dark:to-indigo-500/25">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_0_30px_rgba(59,130,246,0.2)] dark:backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    <h3 className="font-clash text-lg font-semibold text-slate-900 dark:text-white tracking-[0.030em]">Recent Portfolio Runs</h3>
                    <button className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">View all</button>
                </div>

                <div className="mt-4 space-y-3">
                    {runs.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                            No portfolio runs yet.
                        </div>
                    ) : (
                        runs.map((run) => (
                            <div
                                key={run.id}
                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                            >
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{run.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{run.description}</p>
                                </div>
                                <span
                                    className={cn(
                                        'rounded-full border px-3 py-1 text-xs font-semibold',
                                        run.isPositive
                                            ? 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200'
                                            : 'border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/20 dark:text-rose-200'
                                    )}
                                >
                                    {run.performance}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
