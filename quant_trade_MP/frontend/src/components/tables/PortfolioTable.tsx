import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PortfolioWeights } from '@/types';

interface PortfolioTableProps {
  weights: PortfolioWeights;
  prices?: Record<string, number>;
  capital?: number;
}

export function PortfolioTable({ weights, prices, capital = 100000 }: PortfolioTableProps) {
  const rows = Object.entries(weights)
    .filter(([_, weight]) => weight !== 0)
    .map(([symbol, weight]) => {
      const allocation = capital * weight;
      const price = prices?.[symbol] || 0;
      const shares = price > 0 ? Math.floor(allocation / price) : 0;

      return {
        symbol,
        weight: (weight * 100).toFixed(2),
        allocation: allocation.toFixed(2),
        price: price.toFixed(2),
        shares,
      };
    })
    .sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead className="text-right">Weight (%)</TableHead>
          <TableHead className="text-right">Allocation ($)</TableHead>
          {prices && <TableHead className="text-right">Price ($)</TableHead>}
          {prices && <TableHead className="text-right">Shares</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.symbol}>
            <TableCell className="font-medium">{row.symbol}</TableCell>
            <TableCell className="text-right">{row.weight}%</TableCell>
            <TableCell className="text-right">${parseFloat(row.allocation).toLocaleString()}</TableCell>
            {prices && <TableCell className="text-right">${row.price}</TableCell>}
            {prices && <TableCell className="text-right">{row.shares.toLocaleString()}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
