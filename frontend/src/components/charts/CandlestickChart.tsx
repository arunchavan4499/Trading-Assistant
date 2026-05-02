import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  height?: number;
}

export function CandlestickChart({ data, height = 400 }: CandlestickChartProps) {
  // Defensive normalization: ensure numeric fields & filter out invalid rows
  const cleaned = (data || [])
    .map((d) => ({
      date: d.date,
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      close: Number(d.close),
      volume: d.volume != null ? Number(d.volume) : undefined,
    }))
    .filter(
      (d) =>
        d.date &&
        !Number.isNaN(d.open) &&
        !Number.isNaN(d.high) &&
        !Number.isNaN(d.low) &&
        !Number.isNaN(d.close) &&
        d.high >= d.low &&
        d.open >= 0 &&
        d.close >= 0
    );

  // Sort by date (assuming ISO date strings) to avoid disordered axis rendering
  cleaned.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

  if (cleaned.length === 0) {
    return (
      <div className="flex items-center justify-center h-[${height}px] text-sm text-slate-400">
        No valid price data to display.
      </div>
    );
  }

  const priceMin = Math.min(...cleaned.map((d) => d.low));
  const priceMax = Math.max(...cleaned.map((d) => d.high));
  const pad = (priceMax - priceMin) * 0.02 || 1; // small padding even if flat data
  const volumeMax = Math.max(...cleaned.map((d) => d.volume || 0));

  const chartData = cleaned.map((d) => ({
    ...d,
    candleColor: d.close >= d.open ? '#10b981' : '#ef4444',
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          minTickGap={20}
          tickFormatter={(v) => (typeof v === 'string' ? v.slice(0, 10) : v)}
        />
        <YAxis
          yAxisId="price"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          domain={[priceMin - pad, priceMax + pad]}
          allowDecimals
          tickFormatter={(v) => v.toFixed(2)}
        />
        <YAxis
          yAxisId="volume"
          orientation="right"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          domain={[0, Math.round(volumeMax * 1.1) || 1]}
          allowDecimals={false}
          tickFormatter={(val) => `${Math.round(val / 1_000)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0',
          }}
          formatter={(value: any, name: string) => [value, name.toUpperCase()]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Bar dataKey="volume" fill="#8884d8" opacity={0.3} yAxisId="volume" />
        <Line type="monotone" dataKey="high" stroke="#999" dot={false} strokeWidth={1} yAxisId="price" />
        <Line type="monotone" dataKey="low" stroke="#999" dot={false} strokeWidth={1} yAxisId="price" />
        <Line type="monotone" dataKey="open" stroke="#2563eb" strokeWidth={2} yAxisId="price" />
        <Line type="monotone" dataKey="close" stroke="#dc2626" strokeWidth={2} yAxisId="price" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
