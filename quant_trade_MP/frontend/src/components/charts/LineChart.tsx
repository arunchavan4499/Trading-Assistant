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
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 12,
            padding: 10,
          }}
        />
        <Legend />
        {lines.map((line) => (
          <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} name={line.name} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
