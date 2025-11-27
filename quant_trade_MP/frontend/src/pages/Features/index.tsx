import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomLineChart } from '@/components/charts/LineChart';
import { Heatmap } from '@/components/charts/Heatmap';
import { PageLoader } from '@/components/loaders/Loader';
import { useFeatures, useVARDiagnostics, useComputeFeatures, useRunVAR, useFeatureCorrelations } from '@/hooks/useApi';
import { Activity, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Features() {
  const [symbols, setSymbols] = useState('SPY, AAPL, MSFT');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2023-12-31');
  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>(undefined);

  const { mutate: computeFeatures, isPending: isBuildingFeatures } = useComputeFeatures();
  const { mutate: runVAR, isPending: isRunningVAR } = useRunVAR();
  
  const isBuilding = isBuildingFeatures || isRunningVAR;
  
  // Use selectedSymbol if available, otherwise try to use the first one from the list if we have one
  const activeSymbol = selectedSymbol || (symbols.split(',')[0]?.trim());
  const symbolList = symbols.split(',').map(s => s.trim()).filter(s => s);

  const { data: featuresData, isLoading, error } = useFeatures(activeSymbol, startDate, endDate);
  const { data: varDiag } = useVARDiagnostics();
  const { data: correlations } = useFeatureCorrelations(symbolList, startDate, endDate);
  
  const diagData = varDiag as any;

  const handleBuild = () => {
    if (symbolList.length === 0) return;

    // 1. Compute features for each symbol
    computeFeatures({
      symbols: symbolList,
      start_date: startDate,
      end_date: endDate,
      save: true
    }, {
      onSuccess: () => {
        if (symbolList.length > 0) {
            setSelectedSymbol(symbolList[0]);
        }
        
        // 2. Run VAR pipeline to get diagnostics
        runVAR({
            symbols: symbolList,
            start_date: startDate,
            end_date: endDate,
            auto_ridge: true,
            persist_outputs: true,
            save_db_record: true,
            run_name: `Manual Feature Build ${new Date().toISOString()}`
        });
      }
    });
  };

  if (isLoading && !featuresData && activeSymbol) return <PageLoader />;
  
  // Feature time-series from computed features
  const getFeatureTimeSeries = () => {
    if (!featuresData) return null;
    // Format features data for chart if available
    return featuresData;
  };
  
  const featureTimeSeries = getFeatureTimeSeries() || null;

  // Feature correlation matrix
  const getFeatureCorrelation = () => {
    if (!correlations) return { data: [], labels: [] };
    
    // Filter for key features to keep the heatmap readable
    const keyFeatures = ['sma_short', 'sma_medium', 'rsi_14', 'vol_20', 'macd', 'atr_14'];
    const labels = Object.keys(correlations).filter(k => keyFeatures.includes(k));
    
    if (labels.length === 0) return { data: [], labels: [] };

    const data = labels.map(rowKey => {
        return labels.map(colKey => {
            return correlations[rowKey]?.[colKey] ?? 0;
        });
    });
    
    return { data, labels };
  };

  const { data: featureCorrelationData, labels: featureCorrelationLabels } = getFeatureCorrelation();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">Feature Engineering</h1>
            <p className="text-muted-foreground">Technical indicators and VAR diagnostics</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Build Features</CardTitle>
            <CardDescription>Compute technical indicators for a set of symbols</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="symbols">Symbols (comma separated)</Label>
                    <Input 
                        id="symbols" 
                        value={symbols} 
                        onChange={(e) => setSymbols(e.target.value)} 
                        placeholder="SPY, AAPL, MSFT"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input 
                        id="startDate" 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input 
                        id="endDate" 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                    />
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <Button onClick={handleBuild} disabled={isBuilding}>
                    {isBuilding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isBuilding ? 'Building...' : 'Build Features'}
                </Button>
            </div>
        </CardContent>
      </Card>

      {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
              Failed to load feature data: {error.message}
          </div>
      )}

      {/* VAR Diagnostics */}
      {diagData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              VAR(1) Diagnostics
            </CardTitle>
            <CardDescription>Vector autoregression model statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Observations</p>
                <p className="text-2xl font-bold">{diagData.n_obs ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assets</p>
                <p className="text-2xl font-bold">{diagData.n_assets ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ridge Lambda</p>
                <p className="text-2xl font-bold">
                  {typeof diagData.used_ridge_lambda === 'number'
                    ? diagData.used_ridge_lambda.toFixed(6)
                    : 'N/A'}
                </p>
              </div>
            </div>
            {Array.isArray(diagData.eigenvalues) && diagData.eigenvalues.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Top Eigenvalues</p>
                <div className="flex gap-2">
                  {diagData.eigenvalues.slice(0, 5).map((ev: number, idx: number) => (
                    <div key={idx} className="px-3 py-1 bg-secondary rounded text-sm">
                      {ev?.toFixed?.(4) ?? '0.0000'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feature Time Series */}
      {featureTimeSeries && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>SMA 20 & Volatility</CardTitle>
              <CardDescription>Moving average and volatility over time</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomLineChart
                data={featureTimeSeries}
                lines={[
                  { key: 'sma_medium', color: '#3b82f6', name: 'SMA 20' },
                  { key: 'vol_20', color: '#ef4444', name: 'Volatility' },
                ]}
                height={300}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>RSI 14</CardTitle>
              <CardDescription>Relative strength index</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomLineChart
                data={featureTimeSeries}
                lines={[{ key: 'rsi_14', color: '#10b981', name: 'RSI' }]}
                height={300}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feature Correlation */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Correlation Matrix</CardTitle>
          <CardDescription>Correlation between technical indicators</CardDescription>
        </CardHeader>
        <CardContent>
          {featureCorrelationData.length > 0 ? (
            <Heatmap data={featureCorrelationData} labels={featureCorrelationLabels} height={300} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No correlation data available. Build features to generate.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
          <CardDescription>Technical indicators computed for portfolio construction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'SMA 20', description: 'Simple Moving Average (20-day)' },
              { name: 'EMA 12', description: 'Exponential Moving Average (12-day)' },
              { name: 'RSI 14', description: 'Relative Strength Index (14-day)' },
              { name: 'MACD', description: 'Moving Average Convergence Divergence' },
              { name: 'Bollinger Bands', description: 'Volatility bands (20, 2)' },
              { name: 'ATR 14', description: 'Average True Range (14-day)' },
            ].map((feature) => (
              <div key={feature.name} className="p-3 border rounded-lg">
                <p className="font-medium">{feature.name}</p>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
