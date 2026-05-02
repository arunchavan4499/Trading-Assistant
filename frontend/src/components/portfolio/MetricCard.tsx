import { type ReactNode } from 'react';

interface MetricCardProps {
    label: string;
    value: string;
    hint?: string;
    icon?: ReactNode;
}

export function MetricCard({ label, value, hint, icon }: MetricCardProps) {
    return (
        <div className="rounded-2xl bg-slate-100 p-[1px] dark:bg-slate-950 dark:bg-gradient-to-r dark:from-sky-500/30 dark:via-cyan-400/15 dark:to-indigo-500/25">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_0_20px_rgba(59,130,246,0.25)] dark:backdrop-blur-md">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="font-satoshi text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{label}</p>
                        <p className="font-clash mt-3 break-words text-2xl font-semibold leading-tight text-slate-900 dark:text-white">{value}</p>
                    </div>
                    {icon && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-sky-200">
                            {icon}
                        </div>
                    )}
                </div>
                {hint && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
            </div>
        </div>
    );
}
