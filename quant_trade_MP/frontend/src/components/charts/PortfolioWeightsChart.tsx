import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { PortfolioWeights } from '@/types';

interface PortfolioWeightsChartProps {
  weights: PortfolioWeights;
  height?: number;
}

export function PortfolioWeightsChart({ weights, height = 300 }: PortfolioWeightsChartProps) {
  const data = Object.entries(weights)
    .map(([symbol, weight]) => ({
      symbol,
      weight: weight * 100, // Convert to percentage
    }))
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" unit="%" />
        <YAxis type="category" dataKey="symbol" width={80} />
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(2)}%`, 'Weight']}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
          }}
        />
        <Legend />
        <Bar dataKey="weight" name="Portfolio Weight">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.weight >= 0 ? '#10b981' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
