import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SymbolMultiSelect from '@/components/inputs/SymbolMultiSelect';
import { Play } from 'lucide-react';

interface PortfolioFormProps {
    selectedSymbols: string[];
    onSymbolsChange: (symbols: string[]) => void;
    config: {
        startDate: string;
        endDate: string;
        sparsityK: number;
        maxWeight: number;
        riskAversion: number;
    };
    onConfigChange: (config: PortfolioFormProps['config']) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export function PortfolioForm({
    selectedSymbols,
    onSymbolsChange,
    config,
    onConfigChange,
    onSubmit,
    isSubmitting,
}: PortfolioFormProps) {
    return (
        <div className="rounded-2xl bg-slate-100 p-[1px] dark:bg-slate-950 dark:bg-gradient-to-r dark:from-sky-500/30 dark:via-cyan-400/15 dark:to-indigo-500/25">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_0_20px_rgba(59,130,246,0.25)] dark:backdrop-blur-md">
                <h3 className="font-clash text-xl font-semibold tracking-[0.030em] text-slate-900 dark:text-white">Portfolio Configuration</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">Optimize portfolio weighting with VAR indication</p>

                <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
                    <div>
                        <SymbolMultiSelect
                            label="Symbols"
                            value={selectedSymbols}
                            onChange={onSymbolsChange}
                            placeholder="Type company name (e.g. Apple) to autofill"
                        />
                        <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                            Press Enter to add tickers. Remove chips with backspace.
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="sparsityK" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Sparsity (K assets)
                        </Label>
                        <Input
                            id="sparsityK"
                            type="number"
                            value={Number.isFinite(config.sparsityK) ? config.sparsityK : ''}
                            onChange={(e) => {
                                const parsed = parseInt(e.target.value, 10);
                                onConfigChange({
                                    ...config,
                                    sparsityK: Number.isFinite(parsed) ? parsed : 0,
                                });
                            }}
                            className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-400/40 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                        <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                            Controls the max number of assets selected.
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                        <Label htmlFor="startDate" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Start Date
                        </Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={config.startDate}
                            onChange={(e) => onConfigChange({ ...config, startDate: e.target.value })}
                            className="date-input border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-400/40 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                        <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                            Historical lookback window start.
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="endDate" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            End Date
                        </Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={config.endDate}
                            onChange={(e) => onConfigChange({ ...config, endDate: e.target.value })}
                            className="date-input border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-400/40 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                        <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                            Historical lookback window end.
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="maxWeight" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Max Weight per Asset
                        </Label>
                        <Input
                            id="maxWeight"
                            type="number"
                            step="0.05"
                            value={Number.isFinite(config.maxWeight) ? config.maxWeight : ''}
                            onChange={(e) => {
                                const parsed = parseFloat(e.target.value);
                                onConfigChange({
                                    ...config,
                                    maxWeight: Number.isFinite(parsed) ? parsed : 0,
                                });
                            }}
                            className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-400/40 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                        <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                            Caps any single position size.
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="riskAversion" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Risk Aversion
                        </Label>
                        <Input
                            id="riskAversion"
                            type="number"
                            step="0.1"
                            value={Number.isFinite(config.riskAversion) ? config.riskAversion : ''}
                            onChange={(e) => {
                                const parsed = parseFloat(e.target.value);
                                onConfigChange({
                                    ...config,
                                    riskAversion: Number.isFinite(parsed) ? parsed : 0,
                                });
                            }}
                            className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-400/40 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                        <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                            Higher values favor stability.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(56,189,248,0.45)] transition-transform duration-300 hover:scale-[1.01]"
                >
                    <Play className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Constructing Portfolio...' : 'Construct Portfolio'}
                </Button>
            </div>
        </div>
    );
}
