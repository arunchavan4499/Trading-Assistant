interface AllocationRow {
    symbol: string;
    weight: string;
    allocation: string;
    price: string;
    shares: string;
}

interface AllocationTableProps {
    rows: AllocationRow[];
}

export function AllocationTable({ rows }: AllocationTableProps) {
    return (
        <div className="rounded-2xl bg-slate-100 p-[1px] dark:bg-slate-950 dark:bg-gradient-to-r dark:from-sky-500/30 dark:via-cyan-400/15 dark:to-indigo-500/25">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_0_20px_rgba(59,130,246,0.25)] dark:backdrop-blur-md">
                <h3 className="font-clash text-xl font-semibold tracking-[0.030em] text-slate-900 dark:text-white">Allocation Details</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">Optimize mass-weightings</p>

                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-[13px] text-slate-700 dark:text-slate-200">
                        <thead className="text-[11px] uppercase tracking-[0.20em] text-slate-500">
                            <tr>
                                <th className="py-3 text-left">Symbol</th>
                                <th className="py-3 text-left">Weight (%)</th>
                                <th className="py-3 text-left">Allocation ($)</th>
                                <th className="py-3 text-left">Price</th>
                                <th className="py-3 text-left">Shares</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                            {rows.map((row) => (
                                <tr key={row.symbol} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                                    <td className="py-3 font-medium text-slate-900 dark:text-white">{row.symbol}</td>
                                    <td className="py-3">{row.weight}</td>
                                    <td className="py-3">{row.allocation}</td>
                                    <td className="py-3">{row.price}</td>
                                    <td className="py-3">{row.shares}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
