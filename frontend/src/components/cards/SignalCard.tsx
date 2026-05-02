import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignalType } from '@/types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SignalCardProps {
  signal: SignalType;
  deviation: number;
  currentValue: number;
  targetValue: number;
  message: string;
}

export function SignalCard({ signal, deviation, currentValue, targetValue, message }: SignalCardProps) {
  const getSignalColor = () => {
    switch (signal) {
      case SignalType.BUY:
        return 'bg-green-900/30 border-green-500';
      case SignalType.SELL:
        return 'bg-red-900/30 border-red-500';
      default:
        return 'bg-slate-800/30 border-slate-500';
    }
  };

  const getSignalIcon = () => {
    switch (signal) {
      case SignalType.BUY:
        return <TrendingUp className="h-6 w-6 text-green-400" />;
      case SignalType.SELL:
        return <TrendingDown className="h-6 w-6 text-red-400" />;
      default:
        return <Minus className="h-6 w-6 text-slate-400" />;
    }
  };

  return (
    <Card className={cn('border-2', getSignalColor())}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{signal} Signal</CardTitle>
          {getSignalIcon()}
        </div>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Current Value</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">${currentValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Target Value</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">${targetValue.toLocaleString()}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Deviation</p>
            <p className={cn('text-lg font-semibold', deviation > 0 ? 'text-red-400' : 'text-green-400')}>
              {(deviation * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
