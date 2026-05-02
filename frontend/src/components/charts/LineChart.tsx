import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataPoint {
  date: string;
  [key: string]: any;
}

interface LineChartProps {
  data: DataPoint[];
  lines: { key: string; color: string; name: string }[];
  height?: number;
}

export function CustomLineChart({ data, lines, height = 300 }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" opacity={0.6} />
        <XAxis dataKey="date" className="text-xs" tick={{ fill: '#94a3b8' }} />
        <YAxis className="text-xs" tick={{ fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 10,
            color: '#e2e8f0',
          }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8' }} />
        {lines.map((line) => (
          <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} name={line.name} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
