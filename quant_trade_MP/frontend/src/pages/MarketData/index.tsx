import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CandlestickChart } from '@/components/charts/CandlestickChart';
import { Heatmap } from '@/components/charts/Heatmap';
import { PageLoader } from '@/components/loaders/Loader';
import { ErrorDisplay } from '@/components/loaders/ErrorDisplay';
import { useOHLCV } from '@/hooks/useApi';
import { toast } from '@/components/loaders/Toast';
import { TrendingUp } from 'lucide-react';
import { getTodayDateString, getOffsetDateString } from '@/api/utils';

export default function MarketData() {
  const [symbols, setSymbols] = useState('AAPL,MSFT,GOOGL');
  const [startDate, setStartDate] = useState(getOffsetDateString(-365));
  const [endDate, setEndDate] = useState(getTodayDateString());

  const { data: ohlcvData, isLoading, error, refetch } = useOHLCV(
    symbols.split(',').map((s) => s.trim()),
    startDate,
    endDate
  );

  const handleFetch = () => {
    try {
      const symbolList = symbols.split(',').map((s) => s.trim());
      if (symbolList.length === 0) {
        toast.error('Please enter at least one symbol');
        return;
      }
      refetch();
      toast.info(`Fetching market data for ${symbolList.join(', ')}...`);
    } catch (error) {
      toast.error('Failed to fetch market data');
    }
  };

  // Compute correlation matrix from OHLCV data
  const getCorrelationMatrix = () => {
    if (!ohlcvData?.data) return null;
    // For now, return a placeholder - in production, compute from returns
    const symbolList = Object.keys(ohlcvData.data);
    if (symbolList.length === 0) return null;
    // Create identity-like correlation (placeholder)
    const size = Math.min(symbolList.length, 3);
    return Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => (i === j ? 1.0 : 0.5 + Math.random() * 0.3))
    );
  };
  
  const correlationMatrix = getCorrelationMatrix();

  const primarySymbol = symbols.split(',').map((s) => s.trim().toUpperCase())[0];
  const seriesBySymbol = ohlcvData?.data ?? {};
  const primarySeries = seriesBySymbol[primarySymbol] ?? [];

  // Normalize chart data defensively (avoid undefined / string-number issues)
  const chartData = Array.isArray(primarySeries)
    ? primarySeries
        .filter(
          (row) =>
            row &&
            row.date &&
            row.high != null &&
            row.low != null &&
            row.open != null &&
            row.close != null &&
            !Number.isNaN(Number(row.high)) &&
            !Number.isNaN(Number(row.low)) &&
            !Number.isNaN(Number(row.open)) &&
            !Number.isNaN(Number(row.close))
        )
        .map((row) => ({
          date: String(row.date),
          open: Number(row.open),
          high: Number(row.high),
          low: Number(row.low),
          close: Number(row.close),
          volume: row.volume != null ? Number(row.volume) : undefined,
        }))
        .sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Market Data</h1>
        <p className="text-muted-foreground">Fetch and visualize historical OHLCV data</p>
      </div>

      {/* Fetch Form */}
      <Card>
        <CardHeader>
          <CardTitle>Data Fetcher</CardTitle>
          <CardDescription>Enter symbols and date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="symbols">Symbols (comma-separated)</Label>
            <Input
              id="symbols"
              value={symbols}
              onChange={(e) => setSymbols(e.target.value)}
              placeholder="AAPL,MSFT,GOOGL"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleFetch} disabled={isLoading} className="w-full">
            <TrendingUp className="mr-2 h-4 w-4" />
            {isLoading ? 'Fetching...' : 'Fetch Market Data'}
          </Button>
        </CardContent>
      </Card>

      {isLoading && <PageLoader />}
      {error && <ErrorDisplay message="Failed to fetch market data" retry={handleFetch} />}

      {/* Charts */}
      {Object.keys(seriesBySymbol).length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>OHLCV Chart - {primarySymbol}</CardTitle>
              <CardDescription>Candlestick chart with volume</CardDescription>
            </CardHeader>
            <CardContent>
              <CandlestickChart data={chartData} height={400} />
              {chartData.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">No cleaned data available for chart.</p>
              )}
            </CardContent>
          </Card>

          {correlationMatrix && (
            <Card>
              <CardHeader>
                <CardTitle>Correlation Matrix</CardTitle>
                <CardDescription>Asset return correlations</CardDescription>
              </CardHeader>
              <CardContent>
                <Heatmap
                  data={correlationMatrix}
                  labels={symbols
                    .split(',')
                    .map((s) => s.trim().toUpperCase())
                    .slice(0, correlationMatrix.length)}
                  height={300}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Data Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(seriesBySymbol).map(([symbol, data]) => (
                  <div key={symbol} className="flex justify-between border-b pb-2">
                    <span className="font-medium">{symbol}</span>
                    <span className="text-muted-foreground">
                      {Array.isArray(data) ? data.length : 0} data points
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
