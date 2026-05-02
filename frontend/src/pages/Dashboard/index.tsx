import { useMemo, type ReactNode } from 'react';
import { PageLoader } from '@/components/loaders/Loader';
import { ErrorDisplay } from '@/components/loaders/ErrorDisplay';
import { useBacktestRuns, useOHLCV, usePortfolioRuns, useRiskStatus, useUser } from '@/hooks/useApi';
import { getOffsetDateString, getTodayDateString } from '@/api/utils';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { EquityChart } from '@/components/dashboard/EquityChart';
import { RiskTable } from '@/components/dashboard/RiskTable';
import { IntelligencePanel } from '@/components/dashboard/IntelligencePanel';
import { PortfolioRuns } from '@/components/dashboard/PortfolioRuns';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  DollarSign,
  Shield,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export default function Dashboard() {
  const { data: portfolioRuns, isLoading: loadingPortfolio, error: portfolioError } = usePortfolioRuns();
  const { data: backtestRuns, isLoading: loadingBacktest } = useBacktestRuns();
  const { data: riskStatus } = useRiskStatus();
  const { data: user } = useUser();

  if (loadingPortfolio || loadingBacktest) return <PageLoader />;
  if (portfolioError) return <ErrorDisplay message="Failed to load dashboard data" />;

  const latestBacktest = backtestRuns?.[0];
  const latestPortfolio = portfolioRuns?.[0];

  const startDate = latestBacktest?.config?.start_date ?? getOffsetDateString(-180);
  const endDate = latestBacktest?.config?.end_date ?? getTodayDateString();
  const benchmarkSymbol = 'SPY';

  const { data: benchmarkOhlcv } = useOHLCV([benchmarkSymbol], startDate, endDate);
  const portfolioSymbols = latestPortfolio?.symbols ?? [];
  const riskStartDate = getOffsetDateString(-90);
  const riskEndDate = getTodayDateString();
  const { data: portfolioOhlcv } = useOHLCV(portfolioSymbols, riskStartDate, riskEndDate);

  const equityPoints = latestBacktest?.equity_curve ?? [];
  const baseEquity = equityPoints[0]?.equity ?? user?.capital ?? latestBacktest?.metrics?.initial_capital ?? 0;

  const benchmarkSeries = useMemo(() => {
    const points = benchmarkOhlcv?.data?.[benchmarkSymbol] ?? [];
    if (points.length === 0) return [];
    const baseClose = points[0]?.close ?? 1;
    return points.map((point) => ({
      date: point.date,
      value: (point.close / baseClose) * (baseEquity || 1),
    }));
  }, [benchmarkOhlcv, benchmarkSymbol, baseEquity]);

  const equityCurve = useMemo(() => {
    if (equityPoints.length > 0) {
      const benchmarkMap = new Map(benchmarkSeries.map((point) => [point.date, point.value]));
      return equityPoints.map((point) => ({
        date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        portfolio: point.equity,
        sp500: benchmarkMap.get(point.date) ?? point.equity,
      }));
    }

    if (benchmarkSeries.length > 0) {
      return benchmarkSeries.map((point) => ({
        date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        portfolio: point.value,
        sp500: point.value,
      }));
    }

    return [];
  }, [equityPoints, benchmarkSeries]);

  const portfolioValues = equityCurve.map((point) => point.portfolio);

  const computeReturns = (values: number[]) =>
    values.slice(1).map((value, index) => (value - values[index]) / (values[index] || 1));

  const stdDev = (values: number[]) => {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  };

  const drawdownSeries = (() => {
    let peak = 0;
    return portfolioValues.map((value) => {
      peak = Math.max(peak, value);
      return peak > 0 ? ((peak - value) / peak) * 100 : 0;
    });
  })();

  const rollingSharpe = (() => {
    const returns = computeReturns(portfolioValues);
    const windowSize = 10;
    return returns.map((_, index) => {
      const slice = returns.slice(Math.max(0, index - windowSize + 1), index + 1);
      const average = slice.reduce((sum, val) => sum + val, 0) / (slice.length || 1);
      const volatility = stdDev(slice) || 1;
      return (average / volatility) * Math.sqrt(252);
    });
  })();

  const ensureSparkline = (values: number[]) => (values.length >= 2 ? values : [0, 0]);

  const sparklineData = {
    capital: ensureSparkline(portfolioValues.slice(-10)),
    value: ensureSparkline(portfolioValues.slice(-10)),
    sharpe: ensureSparkline(rollingSharpe.slice(-10)),
    drawdown: ensureSparkline(drawdownSeries.slice(-10)),
  };

  const totalCapital = user?.capital ?? latestBacktest?.metrics?.initial_capital ?? latestBacktest?.config?.initial_capital ?? 0;
  const portfolioValue = riskStatus?.current_equity ?? latestBacktest?.metrics?.final_value ?? totalCapital;
  const annReturn = latestBacktest?.metrics?.ann_return ?? latestBacktest?.metrics?.annual_return ?? 0;
  const sharpeRatio = latestBacktest?.metrics?.sharpe ?? 0;
  const currentDrawdown = riskStatus?.current_drawdown ?? latestBacktest?.metrics?.max_drawdown ?? 0;
  const drawdownLimit = riskStatus?.drawdown_limit ?? user?.drawdown_limit ?? 0.2;

  const sharpeDelta = rollingSharpe.length >= 2
    ? rollingSharpe[rollingSharpe.length - 1] - rollingSharpe[rollingSharpe.length - 2]
    : 0;
  const drawdownDelta = drawdownSeries.length >= 2
    ? drawdownSeries[drawdownSeries.length - 1] - drawdownSeries[drawdownSeries.length - 2]
    : 0;

  const totalCapitalDisplay = totalCapital > 0 ? `$${totalCapital.toLocaleString()}` : 'N/A';
  const portfolioValueDisplay = portfolioValue > 0 ? `$${portfolioValue.toLocaleString()}` : 'N/A';
  const sharpeDisplay = sharpeRatio ? sharpeRatio.toFixed(2) : 'N/A';
  const drawdownDisplay = Number.isFinite(currentDrawdown) ? `${(currentDrawdown * 100).toFixed(2)}%` : 'N/A';

  const riskRows = useMemo(() => {
    if (!latestPortfolio || !portfolioOhlcv?.data) return [];
    const equity = portfolioValue || totalCapital || baseEquity;

    return Object.entries(latestPortfolio.weights)
      .map(([symbol, weight]) => {
        const series = portfolioOhlcv.data[symbol] ?? [];
        if (series.length < 2) return null;

        const closes = series.map((point) => point.close).filter((close) => Number.isFinite(close));
        if (closes.length < 2) return null;

        const returns = computeReturns(closes);
        const volatility = stdDev(returns) * 100;
        const plPct = ((closes[closes.length - 1] - closes[0]) / (closes[0] || 1)) * 100;
        const plValue = equity ? equity * weight * (plPct / 100) : 0;
        const riskLevel = volatility >= 2 ? 'HIGH' : volatility >= 1 ? 'MEDIUM' : 'LOW';
        const signal = plPct >= 2 ? 'BUY' : plPct <= -2 ? 'REDUCE' : 'HOLD';

        return {
          symbol,
          name: symbol,
          weight: `${(weight * 100).toFixed(1)}%`,
          volatility: `${volatility.toFixed(2)}%`,
          risk: riskLevel as 'HIGH' | 'MEDIUM' | 'LOW',
          pl: `${plValue >= 0 ? '+' : '-'}$${Math.abs(plValue).toFixed(0)}`,
          plPercent: `${plPct >= 0 ? '+' : ''}${plPct.toFixed(2)}%`,
          plIsPositive: plPct >= 0,
          signal,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .slice(0, 6);
  }, [latestPortfolio, portfolioOhlcv, portfolioValue, totalCapital, baseEquity]);

  const intelligenceItems = useMemo(() => {
    const items = [] as {
      id: string;
      text: string;
      change: string;
      tone: 'positive' | 'negative' | 'neutral';
      icon: ReactNode;
    }[];

    if (riskStatus?.violations?.length) {
      items.push({
        id: 'intel-risk',
        text: riskStatus.violations[0],
        change: 'Alert',
        tone: 'negative',
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    } else if (riskStatus) {
      items.push({
        id: 'intel-safe',
        text: 'Risk checks passed. Portfolio within limits.',
        change: 'OK',
        tone: 'positive',
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
    }

    if (typeof currentDrawdown === 'number') {
      items.push({
        id: 'intel-dd',
        text: `Current drawdown ${(currentDrawdown * 100).toFixed(2)}%`,
        change: `Limit ${(drawdownLimit * 100).toFixed(0)}%`,
        tone: currentDrawdown > drawdownLimit ? 'negative' : 'neutral',
        icon: <Shield className="h-4 w-4" />,
      });
    }

    if (latestBacktest?.metrics?.sharpe) {
      items.push({
        id: 'intel-sharpe',
        text: `Sharpe ratio at ${latestBacktest.metrics.sharpe.toFixed(2)}`,
        change: annReturn >= 0 ? `+${(annReturn * 100).toFixed(2)}%` : `${(annReturn * 100).toFixed(2)}%`,
        tone: annReturn >= 0 ? 'positive' : 'negative',
        icon: <Sparkles className="h-4 w-4" />,
      });
    }

    if (latestPortfolio?.symbols?.length) {
      const topSymbol = Object.entries(latestPortfolio.weights)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .map(([symbol]) => symbol)[0];
      if (topSymbol) {
        items.push({
          id: 'intel-weight',
          text: `${topSymbol} is the largest allocation in the portfolio.`,
          change: `${(latestPortfolio.weights[topSymbol] * 100).toFixed(1)}%`,
          tone: 'neutral',
          icon: <Bell className="h-4 w-4" />,
        });
      }
    }

    if (items.length === 0) {
      items.push({
        id: 'intel-empty',
        text: 'No intelligence data available yet. Run a portfolio or backtest to populate insights.',
        change: 'Waiting',
        tone: 'neutral',
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }

    return items.slice(0, 4);
  }, [riskStatus, currentDrawdown, drawdownLimit, latestBacktest, annReturn, latestPortfolio]);

  const runItems = useMemo(
    () =>
      (portfolioRuns ?? []).slice(0, 3).map((run) => ({
        id: `${run.id}`,
        name: run.run_name,
        description: `${run.symbols?.length || 0} assets · ${run.method || 'optimized'}`,
        performance: run.metrics?.sharpe_ratio
          ? `${run.metrics.sharpe_ratio.toFixed(2)} Sharpe`
          : run.metrics?.expected_return
            ? `${(run.metrics.expected_return * 100).toFixed(2)}%`
            : '0.00%',
        isPositive: (run.metrics?.expected_return || 0) >= 0,
      })),
    [portfolioRuns]
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-satoshi text-xs font-semibold tracking-[0.030em]  text-green-500 dark:text-sky-300">Welcome back! 👋</p>
        <h1 className="font-clash text-3xl tracking-[0.030em] font-semibold text-slate-900 dark:text-white"> Overview</h1>
        <p className="text-base text-slate-500 dark:text-slate-300">
          Monitor & optimize your investment strategy at a glance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Capital"
          value={totalCapitalDisplay}
          change={user?.capital ? 'User capital' : latestBacktest?.metrics?.initial_capital ? 'Backtest capital' : 'Awaiting data'}
          changeLabel="Latest profile sync"
          isPositive
          icon={<DollarSign className="h-4 w-4" />}
          sparkline={sparklineData.capital}
          accent="blue"
        />
        <MetricCard
          title="Portfolio Value"
          value={portfolioValueDisplay}
          change={`${annReturn >= 0 ? '+' : ''}${(annReturn * 100).toFixed(2)}%`}
          changeLabel="Annual return"
          isPositive={annReturn >= 0}
          icon={<TrendingUp className="h-4 w-4" />}
          sparkline={sparklineData.value}
          accent="cyan"
        />
        <MetricCard
          title="Sharpe Ratio"
          value={sharpeDisplay}
          change={`${sharpeDelta >= 0 ? '+' : ''}${sharpeDelta.toFixed(2)}`}
          changeLabel="Rolling delta"
          isPositive={sharpeDelta >= 0}
          icon={<Activity className="h-4 w-4" />}
          sparkline={sparklineData.sharpe}
          accent="indigo"
        />
        <MetricCard
          title="Max Drawdown"
          value={drawdownDisplay}
          change={`${drawdownDelta >= 0 ? '+' : ''}${drawdownDelta.toFixed(2)}%`}
          changeLabel={`${(drawdownLimit * 100).toFixed(0)}% limit`}
          isPositive={currentDrawdown <= drawdownLimit}
          icon={<Shield className="h-4 w-4" />}
          sparkline={sparklineData.drawdown}
          accent="emerald"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <EquityChart data={equityCurve} />
        <RiskTable rows={riskRows} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <IntelligencePanel items={intelligenceItems} />
        <PortfolioRuns runs={runItems} />
      </div>

      {latestPortfolio && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <div>
            <p className="text-slate-900 dark:text-white">Active portfolio detected</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {latestPortfolio.symbols?.length || 0} assets · {latestPortfolio.method || 'optimized'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300">
            <ArrowUpRight className="h-4 w-4" />
            <span>Live</span>
          </div>
        </div>
      )}

      {!latestPortfolio && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <div>
            <p className="text-slate-900 dark:text-white">No active portfolio</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Create one in the Portfolio tab.</p>
          </div>
          <div className="flex items-center gap-2 text-rose-500 dark:text-rose-300">
            <ArrowDownRight className="h-4 w-4" />
            <span>Offline</span>
          </div>
        </div>
      )}
    </div>
  );
}
