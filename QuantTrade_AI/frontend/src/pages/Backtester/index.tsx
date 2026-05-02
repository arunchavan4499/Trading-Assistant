import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SymbolMultiSelect from '@/components/inputs/SymbolMultiSelect';
import { CustomLineChart } from '@/components/charts/LineChart';
import { PageLoader } from '@/components/loaders/Loader';
import { ErrorDisplay } from '@/components/loaders/ErrorDisplay';
import { useRunBacktest, useBacktestRuns } from '@/hooks/useApi';
import { toast } from '@/components/loaders/Toast';
import { BacktestConfig, BacktestResult } from '@/types';
import type { SymbolSuggestion } from '@/types';
import { Play, Download } from 'lucide-react';
import { getTodayDateString, getOffsetDateString } from '@/api/utils';
import { GLOBAL_SYMBOL_SELECTED_EVENT } from '@/lib/events';

export default function Backtester() {
  const { data: backtestRuns, isLoading, error } = useBacktestRuns();
  const runBacktestMutation = useRunBacktest();
  const [latestResult, setLatestResult] = useState<BacktestResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL']);
  const [config, setConfig] = useState<Partial<BacktestConfig>>({
    start_date: getOffsetDateString(-365),
    end_date: getTodayDateString(),
    rebalance_freq: '7D',
    commission_rate: 0.0005,
    slippage_pct: 0.0005,
    sparsity_k: 15,
    max_weight: 0.25,
    initial_capital: 100000,
  });

  const parsedWeights = useMemo(() => {
    const symbols = selectedSymbols;
    if (!symbols.length) return {};

    const provided = config.weights ?? {};
    const defaultWeight = symbols.length ? 1 / symbols.length : 0;

    return symbols.reduce<Record<string, number>>((acc, symbol) => {
      acc[symbol] = provided[symbol] ?? Number(defaultWeight.toFixed(4));
      return acc;
    }, {});
  }, [selectedSymbols, config.weights]);

  const latestBacktest = backtestRuns?.[0];

  const activeBacktest = useMemo(() => {
    return latestResult ?? latestBacktest ?? null;
  }, [latestResult, latestBacktest]);

  const buildBacktestPayload = (): BacktestConfig => {
    const symbols = selectedSymbols;
    if (!symbols.length) {
      throw new Error('Please provide at least one symbol.');
    }
    if (!config.start_date || !config.end_date) {
      throw new Error('Please select both start and end dates.');
    }

    const rebalanceDaysRaw = (config.rebalance_freq ?? '7D').replace(/[^0-9]/g, '');
    const rebalanceDays = Math.max(1, parseInt(rebalanceDaysRaw || '7', 10));

    return {
      symbols,
      start_date: config.start_date,
      end_date: config.end_date,
      rebalance_freq: config.rebalance_freq ?? '7D',
      weights: parsedWeights,
      initial_capital: config.initial_capital ?? 100000,
      commission_rate: config.commission_rate ?? 0.0005,
      slippage_pct: config.slippage_pct ?? 0.0005,
      rebalance_freq_days: rebalanceDays,
      sparsity_k: config.sparsity_k,
      max_weight: config.max_weight,
    };
  };

  const handleRun = async () => {
    try {
      const payload = buildBacktestPayload();
      const result = await runBacktestMutation.mutateAsync(payload);
      setLatestResult(result);
      setFormError(null);
      toast.success(`Backtest completed successfully for ${payload.symbols.join(', ')}`);
    } catch (mutationError) {
      let message = 'Failed to run backtest.';
      if (isAxiosError(mutationError)) {
        const detail = (mutationError.response?.data as { detail?: string })?.detail;
        message = detail || mutationError.message;
      } else if (mutationError instanceof Error) {
        message = mutationError.message;
      }
      setFormError(message);
      toast.error(`Backtest failed: ${message}`);
    }
  };

  // Build equity curve from backtest results if available
  const equityCurve = useMemo(() => {
    if (activeBacktest?.equity_curve && activeBacktest.equity_curve.length) {
      let peak = 0;
      return activeBacktest.equity_curve.map((point) => {
        peak = Math.max(peak, point.equity);
        const drawdown = peak === 0 ? 0 : (point.equity - peak) / peak;
        return {
          date: new Date(point.date).toLocaleDateString(),
          equity: point.equity,
          drawdown,
        };
      });
    }

    if (activeBacktest?.metrics?.final_value) {
      return [
        {
          date: new Date(activeBacktest.created_at).toLocaleDateString(),
          equity: activeBacktest.metrics.final_value,
          drawdown: activeBacktest.metrics.max_drawdown || 0,
        },
      ];
    }

    return [{ date: 'No results', equity: 100000, drawdown: 0 }];
  }, [activeBacktest]);

  const metrics = activeBacktest?.metrics;

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<SymbolSuggestion>).detail;
      if (!detail?.symbol && !detail?.ticker) return;
      const ticker = (detail.ticker || detail.symbol || '').trim().toUpperCase();
      if (!ticker) return;
      setSelectedSymbols((prev) => (prev.includes(ticker) ? prev : [...prev, ticker]));
    };

    window.addEventListener(GLOBAL_SYMBOL_SELECTED_EVENT, handler);
    return () => window.removeEventListener(GLOBAL_SYMBOL_SELECTED_EVENT, handler);
  }, []);

  if (isLoading && !backtestRuns) {
    return <PageLoader />;
  }

  if (error && !backtestRuns) {
    return <ErrorDisplay message="Failed to load backtest data" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-clash text-3xl tracking-[0.030em] font-bold text-slate-900 dark:text-white">Backtester</h1>
        <p className="text-slate-500 dark:text-slate-400">Simulate trading strategies with realistic costs</p>
      </div>

      {/* Config Form */}
      <Card>
        <CardHeader>
          <CardTitle className="tracking-[0.030em]">Backtest Configuration</CardTitle>
          <CardDescription>Set parameters for strategy simulation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <SymbolMultiSelect
              label="Symbols"
              value={selectedSymbols}
              onChange={(list) => setSelectedSymbols(list)}
              placeholder="Search ticker or company"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate tracking-[0.030em]">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={config.start_date}
                onChange={(e) => setConfig({ ...config, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate tracking-[0.030em]">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={config.end_date}
                onChange={(e) => setConfig({ ...config, end_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="rebalanceFreq tracking-[0.030em]">Rebalance Frequency</Label>
              <Input
                id="rebalanceFreq"
                value={config.rebalance_freq}
                onChange={(e) => setConfig({ ...config, rebalance_freq: e.target.value })}
                placeholder="7D"
              />
            </div>
            <div>
              <Label htmlFor="commission tracking-[0.030em]">Commission Rate (%)</Label>
              <Input
                id="commission"
                type="number"
                step="0.001"
                value={(config.commission_rate || 0) * 100}
                onChange={(e) =>
                  setConfig({ ...config, commission_rate: parseFloat(e.target.value) / 100 })
                }
              />
            </div>
            <div>
              <Label htmlFor="slippage">Slippage (%)</Label>
              <Input
                id="slippage"
                type="number"
                step="0.001"
                value={(config.slippage_pct || 0) * 100}
                onChange={(e) => setConfig({ ...config, slippage_pct: parseFloat(e.target.value) / 100 })}
              />
            </div>
            <div>
              <Label htmlFor="capital tracking-[0.030em]">Initial Capital ($)</Label>
              <Input
                id="capital"
                type="number"
                value={config.initial_capital}
                onChange={(e) => setConfig({ ...config, initial_capital: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <Button onClick={handleRun} disabled={runBacktestMutation.isPending} className="w-full">
            <Play className="mr-2 h-4 w-4" />
            {runBacktestMutation.isPending ? 'Running Backtest...' : 'Run Backtest'}
          </Button>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
        </CardContent>
      </Card>

      {/* Results */}
      {activeBacktest ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm tracking-[0.030em]">Sharpe Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-clash text-2xl font-bold text-slate-900 dark:text-white">{metrics?.sharpe?.toFixed(2) || 'N/A'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm tracking-[0.030em]">Annual Return</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-clash text-2xl font-bold text-green-600 dark:text-green-400">
                  {((metrics?.ann_return || metrics?.annual_return || 0) * 100).toFixed(2)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm tracking-[0.030em]">Volatility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-clash text-2xl font-bold text-slate-900 dark:text-white">
                  {((metrics?.ann_vol || metrics?.annual_vol || 0) * 100).toFixed(2)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm tracking-[0.030em]">Max Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-clash text-2xl font-bold text-red-500 dark:text-red-400">
                  {((metrics?.max_drawdown || 0) * 100).toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {equityCurve && equityCurve[0]?.date !== 'No results' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="tracking-[0.030em]">Equity Curve</CardTitle>
                  <CardDescription>Portfolio value over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <CustomLineChart
                    data={equityCurve}
                    lines={[{ key: 'equity', color: '#3b82f6', name: 'Equity' }]}
                    height={300}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="tracking-[0.030em]">Drawdown</CardTitle>
                  <CardDescription>Peak-to-trough decline</CardDescription>
                </CardHeader>
                <CardContent>
                  <CustomLineChart
                    data={equityCurve}
                    lines={[{ key: 'drawdown', color: '#ef4444', name: 'Drawdown' }]}
                    height={300}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="tracking-[0.030em]">Download Results</CardTitle>
              <CardDescription>Export backtest data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Report (JSON)
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Backtests Yet</CardTitle>
            <CardDescription>Run your first backtest to see performance metrics and charts.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
