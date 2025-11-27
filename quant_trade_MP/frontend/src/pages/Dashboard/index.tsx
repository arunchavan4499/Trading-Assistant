import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/cards/StatCard';
import { CustomLineChart } from '@/components/charts/LineChart';
import { PortfolioTable } from '@/components/tables/PortfolioTable';
import { PageLoader } from '@/components/loaders/Loader';
import { ErrorDisplay } from '@/components/loaders/ErrorDisplay';
import { usePortfolioRuns, useBacktestRuns, useRiskStatus } from '@/hooks/useApi';
import { TrendingUp, DollarSign, Activity, Shield } from 'lucide-react';

export default function Dashboard() {
  const { data: portfolioRuns, isLoading: loadingPortfolio, error: portfolioError } = usePortfolioRuns();
  const { data: backtestRuns, isLoading: loadingBacktest } = useBacktestRuns();
  const { data: riskStatus } = useRiskStatus();

  if (loadingPortfolio || loadingBacktest) return <PageLoader />;
  if (portfolioError) return <ErrorDisplay message="Failed to load dashboard data" />;

  const latestPortfolio = portfolioRuns?.[0];
  const latestBacktest = backtestRuns?.[0];

  // Build equity curve from latest backtest if available
  const getEquityCurveData = () => {
    if (!latestBacktest) return [];

    if (latestBacktest.equity_curve && Array.isArray(latestBacktest.equity_curve) && latestBacktest.equity_curve.length > 0) {
      return latestBacktest.equity_curve.map((point: any) => ({
        date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: point.equity || point.value || 0,
      }));
    }

    if (latestBacktest.metrics?.final_value) {
      return [
        {
          date: new Date(latestBacktest.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          value: latestBacktest.metrics.final_value,
        },
      ];
    }

    return [];
  };

  const equityCurve = getEquityCurveData().length > 0 ? getEquityCurveData() : [
    { date: 'No Data', value: 100000 },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Overview</p>
        <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-base text-slate-500">Monitor capital, performance, and recent activity at a glance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            title="Total Capital"
            value={latestBacktest?.metrics?.initial_capital ? `$${latestBacktest.metrics.initial_capital.toLocaleString()}` : '$100,000'}
            description="Available capital"
            icon={<DollarSign className="h-4 w-4" />}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            title="Portfolio Value"
            value={latestBacktest?.metrics?.final_value ? `$${latestBacktest.metrics.final_value.toLocaleString()}` : '$100,000'}
            description={
              latestBacktest?.metrics?.ann_return
                ? `+${(latestBacktest.metrics.ann_return * 100).toFixed(2)}% annual return`
                : latestBacktest?.metrics?.annual_return
                ? `${(latestBacktest.metrics.annual_return * 100).toFixed(2)}% return`
                : '+0.00% from initial'
            }
            icon={<TrendingUp className="h-4 w-4" />}
            trend={
              latestBacktest?.metrics?.ann_return
                ? { value: latestBacktest.metrics.ann_return * 100, isPositive: latestBacktest.metrics.ann_return > 0 }
                : latestBacktest?.metrics?.annual_return
                ? { value: latestBacktest.metrics.annual_return * 100, isPositive: latestBacktest.metrics.annual_return > 0 }
                : { value: 0, isPositive: true }
            }
          />
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            title="Sharpe Ratio"
            value={
              latestBacktest?.metrics?.sharpe
                ? latestBacktest.metrics.sharpe.toFixed(2)
                : 'N/A'
            }
            description="Risk-adjusted return"
            icon={<Activity className="h-4 w-4" />}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            title="Max Drawdown"
            value={riskStatus ? `${((riskStatus.current_drawdown || 0) * 100).toFixed(2)}%` : 'N/A'}
            description={
              riskStatus?.drawdown_limit
                ? `Limit: ${((riskStatus.drawdown_limit || 0.25) * 100).toFixed(0)}%`
                : 'Monitoring risk...'
            }
            icon={<Shield className="h-4 w-4" />}
            trend={
              riskStatus
                ? {
                    value: (riskStatus.current_drawdown || 0) * 100,
                    isPositive: (riskStatus.current_drawdown || 0) <= (riskStatus.drawdown_limit || 0.25),
                  }
                : { value: 0, isPositive: true }
            }
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Equity Curve</CardTitle>
            <CardDescription>Portfolio value over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <CustomLineChart
              data={equityCurve}
              lines={[{ key: 'value', color: '#3b82f6', name: 'Portfolio Value' }]}
              height={360}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Current Holdings</CardTitle>
            <CardDescription>Active portfolio positions</CardDescription>
          </CardHeader>
          <CardContent>
            {latestPortfolio ? (
              <PortfolioTable weights={latestPortfolio.weights} capital={100000} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No active portfolio. Create one in the Portfolio tab.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Portfolio Runs</CardTitle>
          <CardDescription>Latest optimization results</CardDescription>
        </CardHeader>
        <CardContent>
          {portfolioRuns && portfolioRuns.length > 0 ? (
            <div className="space-y-4">
              {portfolioRuns.slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-50/90 px-4 py-4 ring-1 ring-slate-100"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-900">{run.run_name}</p>
                    <p className="text-sm text-slate-500">
                      {run.symbols?.length || 0} assets · {run.method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      Sharpe:{' '}
                      {run.metrics?.sharpe_ratio
                        ? run.metrics.sharpe_ratio.toFixed(3)
                        : run.metrics?.expected_return
                        ? run.metrics.expected_return.toFixed(3)
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(run.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No portfolio runs yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
