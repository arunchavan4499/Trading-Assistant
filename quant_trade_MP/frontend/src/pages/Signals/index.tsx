import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignalCard } from '@/components/cards/SignalCard';
import { RebalanceTable } from '@/components/tables/RebalanceTable';
import { PageLoader } from '@/components/loaders/Loader';
import { useGenerateRebalance, usePortfolioRuns } from '@/hooks/useApi';
import { toast } from '@/components/loaders/Toast';
import { SignalType } from '@/types';
import { Bell } from 'lucide-react';

export default function Signals() {
  const { data: portfolioRuns, isLoading } = usePortfolioRuns();
  const generateMutation = useGenerateRebalance();

  const [prices, setPrices] = useState<Record<string, string>>({
    AAPL: '180.50',
    MSFT: '350.00',
    GOOGL: '140.50',
  });

  const [currentQty, setCurrentQty] = useState<Record<string, string>>({
    AAPL: '100',
    MSFT: '80',
    GOOGL: '50',
  });

  const [currentEquity, setCurrentEquity] = useState<string>('100000');
  const [peakEquity, setPeakEquity] = useState<string>('100000');

  const latestPortfolio = portfolioRuns?.[0];

  // Initialize prices, quantities, and equity values based on portfolio
  useEffect(() => {
    if (latestPortfolio?.weights) {
      const symbols = Object.keys(latestPortfolio.weights);
      // Initialize prices with default values for each symbol
      const newPrices: Record<string, string> = {};
      symbols.forEach((symbol, index) => {
        newPrices[symbol] = prices[symbol] || `${100 + index * 50}`;
      });
      setPrices(newPrices);

      // Initialize quantities with default values for each symbol
      const newQty: Record<string, string> = {};
      symbols.forEach((symbol, index) => {
        newQty[symbol] = currentQty[symbol] || `${50 + index * 10}`;
      });
      setCurrentQty(newQty);

      // Set equity values from portfolio if available
      if (latestPortfolio.current_equity) {
        setCurrentEquity(latestPortfolio.current_equity.toString());
      }
      if (latestPortfolio.peak_equity) {
        setPeakEquity(latestPortfolio.peak_equity.toString());
      }
    }
  }, [latestPortfolio?.id]); // Re-initialize when portfolio changes

  const handleGenerate = async () => {
    try {
      if (!latestPortfolio) {
        toast.error('No active portfolio found');
        return;
      }

      const pricesNum = Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, parseFloat(v)]));
      const qtyNum = Object.fromEntries(Object.entries(currentQty).map(([k, v]) => [k, parseInt(v)]));

      await generateMutation.mutateAsync({
        target_weights: latestPortfolio.weights,
        current_qty: qtyNum,
        prices: pricesNum,
        capital: 100000,
        current_equity: parseFloat(currentEquity),
        peak_equity: parseFloat(peakEquity),
      });

      toast.success('Rebalance plan generated successfully');
    } catch (error) {
      toast.error(`Failed to generate rebalance plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-clash text-3xl font-bold text-slate-900 dark:text-white tracking-[0.030em]">Trade Signal Engine</h1>
        <p className="text-slate-500 dark:text-slate-400">Generate rebalancing trades based on portfolio deviation</p>
      </div>

      {!latestPortfolio ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">No active portfolio. Create one in the Portfolio tab first.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="tracking-[0.030em]">Current Positions & Prices</CardTitle>
              <CardDescription>Enter your current holdings and latest prices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.keys(latestPortfolio.weights).map((symbol) => (
                  <div key={symbol} className="space-y-2">
                    <Label htmlFor={`price-${symbol}`}>{symbol} Price ($)</Label>
                    <Input
                      id={`price-${symbol}`}
                      type="number"
                      step="0.01"
                      value={prices[symbol] || ''}
                      onChange={(e) => setPrices({ ...prices, [symbol]: e.target.value })}
                    />
                    <Label htmlFor={`qty-${symbol}`}>{symbol} Quantity</Label>
                    <Input
                      id={`qty-${symbol}`}
                      type="number"
                      value={currentQty[symbol] || ''}
                      onChange={(e) => setCurrentQty({ ...currentQty, [symbol]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              {/* Equity Tracking for Drawdown Calculation */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">Equity Tracking (for drawdown calculation)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="current-equity">Current Equity ($)</Label>
                    <Input
                      id="current-equity"
                      type="number"
                      step="0.01"
                      value={currentEquity}
                      onChange={(e) => setCurrentEquity(e.target.value)}
                      placeholder="Current portfolio value"
                    />
                  </div>
                  <div>
                    <Label htmlFor="peak-equity">Peak Equity ($)</Label>
                    <Input
                      id="peak-equity"
                      type="number"
                      step="0.01"
                      value={peakEquity}
                      onChange={(e) => setPeakEquity(e.target.value)}
                      placeholder="All-time high portfolio value"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                {generateMutation.isPending ? 'Generating...' : 'Generate Rebalance Plan'}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {generateMutation.data && (
            <>
              {(() => {
                const action = generateMutation.data.summary.action;
                const normalized = typeof action === 'string' ? action.toUpperCase() : 'HOLD';
                const signal: SignalType = normalized === 'BUY'
                  ? SignalType.BUY
                  : normalized === 'SELL'
                    ? SignalType.SELL
                    : SignalType.HOLD;
                return (
                  <SignalCard
                    signal={signal}
                    deviation={generateMutation.data.summary.l1_deviation}
                    currentValue={generateMutation.data.summary.current_value}
                    targetValue={generateMutation.data.summary.target_value}
                    message={`L1 Deviation: ${(generateMutation.data.summary.l1_deviation * 100).toFixed(2)}%`}
                  />
                );
              })()}

              <Card>
                <CardHeader>
                  <CardTitle>Rebalance Trades</CardTitle>
                  <CardDescription>Detailed trade breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <RebalanceTable plan={generateMutation.data} />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
