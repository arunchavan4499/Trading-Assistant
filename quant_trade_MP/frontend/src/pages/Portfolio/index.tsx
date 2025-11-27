import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PortfolioWeightsChart } from '@/components/charts/PortfolioWeightsChart';
import { PortfolioTable } from '@/components/tables/PortfolioTable';
import { Heatmap } from '@/components/charts/Heatmap';
import { PageLoader } from '@/components/loaders/Loader';
import { ErrorDisplay } from '@/components/loaders/ErrorDisplay';
import { useConstructPortfolio, usePortfolioRuns } from '@/hooks/useApi';
import { toast } from '@/components/loaders/Toast';
import { PCOptions } from '@/types';
import { Play } from 'lucide-react';
import { getTodayDateString, getOffsetDateString } from '@/api/utils';

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

  const handleConstruct = async () => {
    try {
      const symbols = config.symbols.split(',').map((s) => s.trim().toUpperCase());
      
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

  // Extract covariance matrix from portfolio metrics if available
  const getCovarianceMatrix = () => {
    if (!latestPortfolio?.metrics?.cov_matrix) return null;
    // If cov_matrix is a nested array, use it directly
    if (Array.isArray(latestPortfolio.metrics.cov_matrix)) {
      return latestPortfolio.metrics.cov_matrix;
    }
    return null;
  };
  
  const covMatrix = getCovarianceMatrix();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio Constructor</h1>
        <p className="text-muted-foreground">Optimize portfolio weights using VAR decomposition</p>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Configuration</CardTitle>
          <CardDescription>Set parameters for portfolio optimization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="symbols">Symbols (comma-separated)</Label>
              <Input
                id="symbols"
                value={config.symbols}
                onChange={(e) => setConfig({ ...config, symbols: e.target.value })}
                placeholder="AAPL,MSFT,GOOGL"
              />
            </div>
            <div>
              <Label htmlFor="sparsityK">Sparsity K (# assets)</Label>
              <Input
                id="sparsityK"
                type="number"
                value={Number.isFinite(config.sparsityK) ? config.sparsityK : ''}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  setConfig({ ...config, sparsityK: Number.isFinite(parsed) ? parsed : 0 });
                }}
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="maxWeight">Max Weight per Asset</Label>
              <Input
                id="maxWeight"
                type="number"
                step="0.05"
                value={Number.isFinite(config.maxWeight) ? config.maxWeight : ''}
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value);
                  setConfig({ ...config, maxWeight: Number.isFinite(parsed) ? parsed : 0 });
                }}
              />
            </div>
            <div>
              <Label htmlFor="riskAversion">Risk Aversion</Label>
              <Input
                id="riskAversion"
                type="number"
                step="0.1"
                value={Number.isFinite(config.riskAversion) ? config.riskAversion : ''}
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value);
                  setConfig({ ...config, riskAversion: Number.isFinite(parsed) ? parsed : 0 });
                }}
              />
            </div>
          </div>
          <Button onClick={handleConstruct} disabled={constructMutation.isPending} className="w-full">
            <Play className="mr-2 h-4 w-4" />
            {constructMutation.isPending ? 'Constructing Portfolio...' : 'Construct Portfolio'}
          </Button>
          {constructMutation.isError && (
            <ErrorDisplay message={(constructMutation.error as Error).message} />
          )}
        </CardContent>
      </Card>

      {/* Latest Portfolio */}
      {latestPortfolio && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Weights</CardTitle>
                <CardDescription>Optimized asset allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioWeightsChart weights={latestPortfolio.weights} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portfolio Metrics</CardTitle>
                <CardDescription>Risk and return characteristics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Return</p>
                    <p className="text-2xl font-bold">
                      {(((latestPortfolio.metrics?.expected_return ?? 0) * 100)).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Portfolio Volatility</p>
                    <p className="text-2xl font-bold">
                      {(((latestPortfolio.metrics?.portfolio_std ?? latestPortfolio.metrics?.std_dev ?? 0) * 100)).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Number of Assets</p>
                    <p className="text-2xl font-bold">{latestPortfolio.metrics.n_assets}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Method</p>
                    <p className="text-lg font-medium">{latestPortfolio.method}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Allocation Details</CardTitle>
              <CardDescription>Position sizing and weights</CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioTable weights={latestPortfolio.weights} capital={100000} />
            </CardContent>
          </Card>

          {covMatrix && (
            <Card>
              <CardHeader>
                <CardTitle>Covariance Matrix</CardTitle>
                <CardDescription>Asset correlation structure</CardDescription>
              </CardHeader>
              <CardContent>
                <Heatmap data={covMatrix} labels={latestPortfolio.symbols.slice(0, covMatrix.length)} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
