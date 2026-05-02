import { useEffect, useMemo, useState } from 'react';
import { PageLoader } from '@/components/loaders/Loader';
import { ErrorDisplay } from '@/components/loaders/ErrorDisplay';
import { useConstructPortfolio, usePortfolioRuns } from '@/hooks/useApi';
import { toast } from '@/components/loaders/Toast';
import { PCOptions, type SymbolSuggestion } from '@/types';
import { getTodayDateString, getOffsetDateString } from '@/api/utils';
import { GLOBAL_SYMBOL_SELECTED_EVENT } from '@/lib/events';
import { PortfolioForm } from '@/components/portfolio/PortfolioForm';
import { WeightsChart } from '@/components/portfolio/WeightsChart';
import { PortfolioMetrics } from '@/components/portfolio/PortfolioMetrics';
import { AllocationTable } from '@/components/portfolio/AllocationTable';

export default function Portfolio() {
  const { data: portfolioRuns, isLoading, error } = usePortfolioRuns();
  const constructMutation = useConstructPortfolio();

  const [config, setConfig] = useState({
    symbols: 'AAPL,MSFT,GOOGL,AMZN,META',
    startDate: getOffsetDateString(-365),
    endDate: getTodayDateString(),
    sparsityK: 15,
    maxWeight: 0.25,
    riskAversion: 1.0,
    method: 'sparse_mean_reverting' as const,
  });
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(
    config.symbols.split(',').map((s) => s.trim().toUpperCase())
  );

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

  const handleConstruct = async () => {
    try {
      const symbols = selectedSymbols.map((s) => s.trim().toUpperCase()).filter((s) => s);

      if (symbols.length === 0) {
        toast.error('Please enter at least one symbol');
        return;
      }

      const options: PCOptions = {
        method: config.method,
        sparsity_k: config.sparsityK,
        max_weight: config.maxWeight,
        min_weight: 0.0,
        allow_short: false,
        risk_aversion: config.riskAversion,
        sparsity_keep_signed: false,
        cov_ridge: 1e-6,
        persist: true,
      };

      await constructMutation.mutateAsync({
        symbols,
        start_date: config.startDate,
        end_date: config.endDate,
        ridge_lambda: 1e-3,
        options,
      });

      toast.success(`Portfolio constructed successfully for ${symbols.join(', ')}`);
    } catch (error) {
      toast.error(`Failed to construct portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorDisplay message="Failed to load portfolio data" />;

  const latestPortfolio = portfolioRuns?.[0];
  const weights = latestPortfolio?.weights ?? {
    MSFT: 0.2545,
    GOOGL: 0.2541,
    AMZN: 0.2317,
    AAPL: 0.2503,
  };

  const weightsData = useMemo(
    () =>
      Object.entries(weights)
        .map(([symbol, weight]) => ({
          symbol,
          weight: weight * 100,
        }))
        .sort((a, b) => b.weight - a.weight),
    [weights]
  );

  const expectedReturn = latestPortfolio?.metrics?.expected_return ?? 0.1298;
  const volatility = latestPortfolio?.metrics?.portfolio_std ?? latestPortfolio?.metrics?.std_dev ?? 0.2002;
  const sharpeRatio = latestPortfolio?.metrics?.sharpe_ratio ?? 0.7809;
  const method = latestPortfolio?.method ?? 'sparse_mean_reverting';

  const allocationRows = useMemo(() => {
    const capital = 100000;
    return weightsData.map((row) => {
      const price = 150 + row.weight * 2.5;
      const allocation = (capital * row.weight) / 100;
      const shares = allocation / price;
      return {
        symbol: row.symbol,
        weight: `${row.weight.toFixed(2)}%`,
        allocation: `$${allocation.toFixed(0)}`,
        price: `$${price.toFixed(2)}`,
        shares: `${Math.max(1, Math.floor(shares))}`,
      };
    });
  }, [weightsData]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-clash text-4xl font-semibold tracking-[0.030em] text-slate-900 dark:text-white ">Portfolio Constructor</h1>
        <p className="text-base leading-relaxed text-slate-500 dark:text-slate-300">
          Optimize portfolio weights using VAR decomposition
        </p>
      </div>

      <PortfolioForm
        selectedSymbols={selectedSymbols}
        onSymbolsChange={setSelectedSymbols}
        config={config}
        onConfigChange={(partial) => setConfig((prev) => ({ ...prev, ...partial }))}
        onSubmit={handleConstruct}
        isSubmitting={constructMutation.isPending}
      />

      {constructMutation.isError && (
        <ErrorDisplay message={(constructMutation.error as Error).message} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <WeightsChart data={weightsData} />
        <PortfolioMetrics
          expectedReturn={`${(expectedReturn * 100).toFixed(2)}%`}
          volatility={`${(volatility * 100).toFixed(2)}%`}
          sharpeRatio={`${(sharpeRatio * 100).toFixed(2)}%`}
          method={method}
        />
      </div>

      <AllocationTable rows={allocationRows} />
    </div>
  );
}
