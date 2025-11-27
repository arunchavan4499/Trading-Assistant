import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/loaders/Loader';
import { ErrorDisplay } from '@/components/loaders/ErrorDisplay';
import { useRiskStatus, useRiskLimits } from '@/hooks/useApi';
import { Shield, AlertTriangle, TrendingDown, AlertCircle, Settings, TrendingUp, Lock } from 'lucide-react';
import { useState } from 'react';

export default function Risk() {
  const { data: riskStatus, isLoading, error } = useRiskStatus();
  const { data: riskLimits } = useRiskLimits();
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorDisplay message="Failed to load risk data" />;

  const drawdownPct = (riskStatus?.current_drawdown || 0) * 100;
  const limitPct = (riskStatus?.drawdown_limit || 0.25) * 100;
  const drawdownRatio = Math.abs(drawdownPct / limitPct);

  const getDrawdownColor = () => {
    if (drawdownRatio < 0.5) return 'bg-green-500';
    if (drawdownRatio < 0.8) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = () => {
    if (riskStatus?.is_safe) return <Shield className="h-12 w-12 text-green-500" />;
    return <AlertTriangle className="h-12 w-12 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Risk Management</h1>
        <p className="text-muted-foreground">Monitor portfolio risk and exposure limits</p>
      </div>

      {/* Risk Status */}
      <Card className={riskStatus?.is_safe ? '' : 'border-red-500'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getStatusIcon()}
            {riskStatus?.is_safe ? 'Portfolio Within Limits' : 'RISK BREACH DETECTED'}
          </CardTitle>
          <CardDescription>
            {riskStatus?.is_safe
              ? 'All risk metrics are within acceptable thresholds'
              : 'Immediate action required - portfolio exceeds risk limits'}
          </CardDescription>
        </CardHeader>
        {!riskStatus?.is_safe && riskStatus?.message && (
          <CardContent>
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{riskStatus.message}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Action Controls When Breach Detected */}
      {!riskStatus?.is_safe && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <AlertCircle className="h-5 w-5" />
              Take Action to Control Risk
            </CardTitle>
            <CardDescription className="text-orange-800 dark:text-orange-200">
              Choose one of the following options to resolve the breach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Action 1: Reduce Position Sizes */}
              <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 hover:bg-orange-100 dark:hover:bg-orange-900 transition cursor-pointer" 
                   onClick={() => setExpandedAction(expandedAction === 'reduce' ? null : 'reduce')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100">1. Reduce Oversized Positions</p>
                      <p className="text-sm text-orange-800 dark:text-orange-200">Sell assets that exceed max allocation</p>
                    </div>
                  </div>
                  <div className="text-orange-600">→</div>
                </div>
                {expandedAction === 'reduce' && (
                  <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                    <p className="text-sm mb-2 text-orange-900 dark:text-orange-100">Positions to reduce:</p>
                    {riskStatus?.position_limits && Object.entries(riskStatus.position_limits).map(([symbol, limit]) => {
                      const exposure = (limit as any).current || 0;
                      const maxExposure = (limit as any).max || 0.3;
                      if (exposure > maxExposure * 0.85) {
                        const toReduce = ((exposure - maxExposure * 0.8) * 100).toFixed(2);
                        return (
                          <div key={symbol} className="text-sm text-orange-800 dark:text-orange-200 ml-4">
                            • Sell {toReduce}% of {symbol} (currently {(exposure * 100).toFixed(1)}%)
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>

              {/* Action 2: Increase Drawdown Limit */}
              <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 hover:bg-orange-100 dark:hover:bg-orange-900 transition cursor-pointer"
                   onClick={() => setExpandedAction(expandedAction === 'limit' ? null : 'limit')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100">2. Adjust Risk Limits</p>
                      <p className="text-sm text-orange-800 dark:text-orange-200">Increase position size or drawdown limits</p>
                    </div>
                  </div>
                  <div className="text-orange-600">→</div>
                </div>
                {expandedAction === 'limit' && (
                  <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800 space-y-2">
                    <div className="text-sm font-semibold text-orange-900 dark:text-orange-100">Current Limits:</div>
                    <div className="text-sm text-orange-800 dark:text-orange-200 ml-4 space-y-1">
                      <div>• Max Position Size: 20% → Consider increasing to 25-30%</div>
                      <div>• Max Drawdown: {((riskStatus?.drawdown_limit ?? 0.2) * 100).toFixed(1)}% → Consider increasing by 5-10%</div>
                    </div>
                    <p className="text-sm mt-2 text-orange-700 dark:text-orange-300">
                      Go to <a href="/settings" className="font-semibold underline">Settings</a> to adjust these limits
                    </p>
                  </div>
                )}
              </div>

              {/* Action 3: Diversify Portfolio */}
              <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 hover:bg-orange-100 dark:hover:bg-orange-900 transition cursor-pointer"
                   onClick={() => setExpandedAction(expandedAction === 'diversify' ? null : 'diversify')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100">3. Diversify Holdings</p>
                      <p className="text-sm text-orange-800 dark:text-orange-200">Add more assets to spread risk</p>
                    </div>
                  </div>
                  <div className="text-orange-600">→</div>
                </div>
                {expandedAction === 'diversify' && (
                  <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                      Current portfolio holds {riskStatus?.position_limits ? Object.keys(riskStatus.position_limits).length : 0} assets.
                    </p>
                    <ul className="text-sm text-orange-800 dark:text-orange-200 ml-4 space-y-1">
                      <li>• Add 2-3 uncorrelated assets</li>
                      <li>• Consider different sectors</li>
                      <li>• Rebalance to equal-weight allocation</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Action 4: Stop & Review */}
              <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 hover:bg-orange-100 dark:hover:bg-orange-900 transition cursor-pointer"
                   onClick={() => setExpandedAction(expandedAction === 'stop' ? null : 'stop')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100">4. Pause & Review Strategy</p>
                      <p className="text-sm text-orange-800 dark:text-orange-200">Stop trading and assess portfolio</p>
                    </div>
                  </div>
                  <div className="text-orange-600">→</div>
                </div>
                {expandedAction === 'stop' && (
                  <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                    <div className="text-sm text-orange-800 dark:text-orange-200 space-y-2">
                      <p className="font-semibold">Consider:</p>
                      <ul className="ml-4 space-y-1">
                        <li>✓ Review your trading signals</li>
                        <li>✓ Check market conditions</li>
                        <li>✓ Verify strategy parameters</li>
                        <li>✓ Run backtests before resuming</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Drawdown Monitor
          </CardTitle>
          <CardDescription>Current drawdown vs. limit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Drawdown</p>
              <p className="text-3xl font-bold text-red-600">{Math.abs(drawdownPct).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Drawdown Limit</p>
              <p className="text-3xl font-bold">{limitPct.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilization</p>
              <p className="text-3xl font-bold">{(drawdownRatio * 100).toFixed(0)}%</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-8 bg-secondary rounded-lg overflow-hidden">
            <div
              className={`h-full transition-all ${getDrawdownColor()}`}
              style={{ width: `${Math.min(drawdownRatio * 100, 100)}%` }}
            />
            {/* Limit Marker */}
            <div className="absolute top-0 right-0 h-full w-1 bg-red-800" />
          </div>
        </CardContent>
      </Card>

      {/* Exposure Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Exposure by Asset</CardTitle>
          <CardDescription>Current position sizes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riskStatus?.position_limits && Object.keys(riskStatus.position_limits).length > 0 ? (
              Object.entries(riskStatus.position_limits).map(([symbol, limit]) => {
                const exposure = (limit as any).current || 0;
                const maxExposure = (limit as any).max || 0.3;
                const ratio = exposure / maxExposure;
                return (
                  <div key={symbol}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{symbol}</span>
                      <span className="text-sm text-muted-foreground">
                        {(exposure * 100).toFixed(1)}% / {(maxExposure * 100).toFixed(0)}% max
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded overflow-hidden">
                      <div
                        className={`h-full ${ratio < 0.8 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No positions currently held</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Limits Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Limits</CardTitle>
          <CardDescription>Configured thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm">Max Drawdown Limit</span>
              <span className="font-medium">
                {riskLimits?.max_drawdown 
                  ? (riskLimits.max_drawdown * 100).toFixed(2) 
                  : '20.00'}%
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm">Max Position Size</span>
              <span className="font-medium">
                {riskLimits?.max_position_fraction
                  ? (riskLimits.max_position_fraction * 100).toFixed(2)
                  : '20.00'}%
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm">Max Assets in Portfolio</span>
              <span className="font-medium">{riskLimits?.max_assets || 15}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm">Risk Check Interval</span>
              <span className="font-medium">30 seconds</span>
            </div>
            <div className="mt-4">
              <a 
                href="/settings" 
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Edit limits in Settings →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
