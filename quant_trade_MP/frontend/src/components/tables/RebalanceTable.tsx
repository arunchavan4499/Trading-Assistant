import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RebalancePlan, SignalType } from '@/types';
import { cn } from '@/lib/utils';

interface RebalanceTableProps {
  plan: RebalancePlan;
}

export function RebalanceTable({ plan }: RebalanceTableProps) {
  if (!plan || !plan.trades) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No rebalance data available yet.
      </div>
    );
  }

  const formatCurrency = (value?: number) => (value ?? 0).toLocaleString();
  const formatPercent = (value?: number) => `${((value ?? 0) * 100).toFixed(2)}%`;

  const trades = Object.entries(plan.trades).filter(
    ([_, trade]) => trade.side !== SignalType.HOLD
  );

  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No rebalancing trades required. Portfolio is within target thresholds.
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Action</TableHead>
            <TableHead className="text-right">Current ($)</TableHead>
            <TableHead className="text-right">Target ($)</TableHead>
            <TableHead className="text-right">Difference ($)</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Deviation (%)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map(([symbol, trade]) => (
            <TableRow key={symbol}>
              <TableCell className="font-medium">{symbol}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-semibold',
                    trade.side === SignalType.BUY
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  )}
                >
                  {trade.side}
                </span>
              </TableCell>
              <TableCell className="text-right">${formatCurrency(trade.current_notional)}</TableCell>
              <TableCell className="text-right">${formatCurrency(trade.target_notional)}</TableCell>
              <TableCell
                className={cn(
                  'text-right font-semibold',
                  (trade.notional_diff ?? 0) > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                ${formatCurrency(Math.abs(trade.notional_diff ?? 0))}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(trade.quantity)}</TableCell>
              <TableCell className="text-right">{formatPercent(trade.deviation)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Current Value</p>
            <p className="text-lg font-semibold">${formatCurrency(plan.summary?.current_value)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Target Value</p>
            <p className="text-lg font-semibold">${formatCurrency(plan.summary?.target_value)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Deviation</p>
            <p className="text-lg font-semibold">{formatPercent(plan.summary?.l1_deviation)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
