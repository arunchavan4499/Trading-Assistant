import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface WeightsChartProps {
    data: { symbol: string; weight: number }[];
}

function formatPercent(value: number) {
    return `${value.toFixed(2)}%`;
}

export function WeightsChart({ data }: WeightsChartProps) {
    return (
        <div className="rounded-2xl bg-slate-100 p-[1px] dark:bg-slate-950 dark:bg-gradient-to-r dark:from-sky-500/30 dark:via-cyan-400/15 dark:to-indigo-500/25">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_0_20px_rgba(59,130,246,0.25)] dark:backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-clash text-xl font-semibold tracking-[0.030em] text-slate-900 dark:text-white">Portfolio Weights</h3>
                        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">Optimized allocation percentages</p>
                    </div>
                </div>

                <div className="mt-6 h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
                            <defs>
                                <linearGradient id="weightsGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#22d3ee" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" horizontal={false} />
                            <XAxis
                                type="number"
                                tickFormatter={formatPercent}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                dataKey="symbol"
                                type="category"
                                tick={{ fill: '#cbd5f5', fontSize: 13 }}
                                axisLine={false}
                                tickLine={false}
                                width={70}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(2,6,23,0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12,
                                }}
                                formatter={(value) => formatPercent(Number(value))}
                            />
                            <Bar dataKey="weight" fill="url(#weightsGradient)" radius={[8, 8, 8, 8]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 text-[11px] uppercase tracking-[0.20em] text-slate-500">
                    Portfolio Weight
                </div>
            </div>
        </div>
    );
}
