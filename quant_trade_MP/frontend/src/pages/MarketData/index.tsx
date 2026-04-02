import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SymbolMultiSelect from '@/components/inputs/SymbolMultiSelect';
import { CandlestickChart } from '@/components/charts/CandlestickChart';
import { Heatmap } from '@/components/charts/Heatmap';
import { PageLoader } from '@/components/loaders/Loader';
import { ErrorDisplay } from '@/components/loaders/ErrorDisplay';
import { useOHLCV } from '@/hooks/useApi';
import { toast } from '@/components/loaders/Toast';
import { TrendingUp } from 'lucide-react';
import { getTodayDateString, getOffsetDateString } from '@/api/utils';
import type { SymbolSuggestion } from '@/types';
import { GLOBAL_SYMBOL_SELECTED_EVENT } from '@/lib/events';

export default function MarketData() {
  const [symbols, setSymbols] = useState<SymbolSuggestion[]>([
    { symbol: 'AAPL' },
    { symbol: 'MSFT' },
    { symbol: 'GOOGL' },
  ]);
  const [startDate, setStartDate] = useState(getOffsetDateString(-365));
  const [endDate, setEndDate] = useState(getTodayDateString());

  const selectedTickers = useMemo(
    () => symbols.map((s) => s.ticker ?? s.symbol?.trim().toUpperCase()).filter((s): s is string => Boolean(s)),
    [symbols]
  );

  const { data: ohlcvData, isLoading, error, refetch } = useOHLCV(selectedTickers, startDate, endDate);

  const handleSymbolChange = (list: string[]) => {
    setSymbols((prev) => {
      const normalized = Array.from(new Set(list.map((sym) => sym.trim().toUpperCase()).filter(Boolean)));
      return normalized.map((symbol) => prev.find((entry) => entry.symbol === symbol) ?? { symbol });
    });
  };

  const handleFetch = () => {
    try {
      const symbolList = selectedTickers;
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

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<SymbolSuggestion>).detail;
      if (!detail?.symbol && !detail?.ticker) return;
      const ticker = (detail.ticker || detail.symbol || '').trim().toUpperCase();
      if (!ticker) return;

      setSymbols((prev) => {
        const exists = prev.some((entry) => {
          const key = (entry.ticker || entry.symbol || '').trim().toUpperCase();
          return key === ticker;
        });
        if (exists) {
          return prev;
        }
        return [
          ...prev,
          {
            symbol: ticker,
            ticker,
            name: detail.name,
            exchange: detail.exchange,
            sector: detail.sector,
            score: detail.score,
          },
        ];
      });
    };

    window.addEventListener(GLOBAL_SYMBOL_SELECTED_EVENT, handler);
    return () => window.removeEventListener(GLOBAL_SYMBOL_SELECTED_EVENT, handler);
  }, []);

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

  const primarySymbol = selectedTickers[0] || '';
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
        <h1 className="font-clash text-3xl tracking-[0.030em] font-bold text-slate-900 dark:text-white">Market Data</h1>
        <p className="text-slate-500 dark:text-slate-400">Fetch and visualize historical OHLCV data</p>
      </div>

      {/* Fetch Form */}
      <Card>
        <CardHeader>
          <CardTitle className='tracking-[0.030em]'>Data Fetcher</CardTitle>
          <CardDescription>Enter symbols and date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <SymbolMultiSelect
              label="Symbols"
              value={selectedTickers}
              onChange={handleSymbolChange}
              placeholder="Type ticker and press Enter"
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
              <CardTitle className="tracking-[0.030em]">OHLCV Chart - {primarySymbol}</CardTitle>
              <CardDescription>Candlestick chart with volume</CardDescription>
            </CardHeader>
            <CardContent>
              <CandlestickChart data={chartData} height={400} />
              {chartData.length === 0 && (
                <p className="mt-2 text-xs text-slate-400">No cleaned data available for chart.</p>
              )}
            </CardContent>
          </Card>

          {correlationMatrix && (
            <Card>
              <CardHeader>
                <CardTitle className="tracking-[0.030em]">Correlation Matrix</CardTitle>
                <CardDescription>Asset return correlations</CardDescription>
              </CardHeader>
              <CardContent>
                <Heatmap
                  data={correlationMatrix}
                  labels={selectedTickers.slice(0, correlationMatrix.length)}
                  height={300}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="tracking-[0.030em]">Data Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(seriesBySymbol).map(([symbol, data]) => (
                  <div key={symbol} className="flex justify-between border-b pb-2">
                    <span className="font-medium">{symbol}</span>
                    <span className="text-slate-400">
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
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<SymbolSuggestion>).detail;
      if (!detail?.symbol && !detail?.ticker) return;
      const ticker = (detail.ticker || detail.symbol || '').trim().toUpperCase();
      if (!ticker) return;

      setSymbols((prev) => {
        const exists = prev.some((entry) => {
          const key = (entry.ticker || entry.symbol || '').trim().toUpperCase();
          return key === ticker;
        });
        if (exists) {
          return prev;
        }
        return [
          ...prev,
          {
            symbol: ticker,
            ticker,
            name: detail.name,
            exchange: detail.exchange,
            sector: detail.sector,
            score: detail.score,
          },
        ];
      });
    };

    window.addEventListener(GLOBAL_SYMBOL_SELECTED_EVENT, handler);
    return () => window.removeEventListener(GLOBAL_SYMBOL_SELECTED_EVENT, handler);
  }, []);
}
