import { cn } from '@/lib/utils';

export interface IntelligenceItem {
    id: string;
    text: string;
    change: string;
    tone: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
}

interface IntelligencePanelProps {
    items: IntelligenceItem[];
}

const toneStyles = {
    positive: 'text-emerald-300',
    negative: 'text-rose-300',
    neutral: 'text-sky-200',
};

export function IntelligencePanel({ items }: IntelligencePanelProps) {
    return (
        <div className="h-full rounded-2xl bg-slate-100 p-[1px] dark:bg-slate-950 dark:bg-gradient-to-r dark:from-sky-500/30 dark:via-indigo-500/15 dark:to-fuchsia-500/25">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_0_30px_rgba(59,130,246,0.2)] dark:backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-500 dark:bg-sky-500/20 dark:text-sky-200">
                        {items[0]?.icon}
                    </span>
                    <h3 className="font-clash text-lg font-semibold text-slate-900 dark:text-white tracking-[0.030em]">Today's Intelligence</h3>
                </div>

                <div className="mt-4 space-y-4">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className={cn(
                                'flex items-center justify-between gap-4 text-sm text-slate-700 dark:text-slate-200',
                                index > 0 && 'border-t border-slate-200 pt-4 dark:border-white/10'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-200">
                                    {item.icon}
                                </span>
                                <p>{item.text}</p>
                            </div>
                            <span className={cn('text-xs font-semibold', toneStyles[item.tone])}>{item.change}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
