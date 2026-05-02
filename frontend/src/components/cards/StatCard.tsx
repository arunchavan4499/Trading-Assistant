import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 hover:shadow-[0_30px_80px_rgba(59,130,246,0.15)] hover:-translate-y-1 flex flex-col h-full',
        className
      )}
    >
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-0 relative z-10">
        <div className="flex-1">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {title}
          </CardTitle>
          <div className="font-clash text-4xl font-bold text-slate-900 dark:text-white">
            {value}
          </div>
        </div>
        {icon && (
          <div className="rounded-lg bg-sky-500/15 p-3 text-sky-400 group-hover:bg-sky-500/25 transition-colors duration-300">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 pt-4 relative z-10 flex flex-col justify-end">
        {description && <p className="text-sm text-slate-400">{description}</p>}
        {trend && (
          <div
            className={cn(
              'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all duration-200 w-fit',
              trend.isPositive
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-red-500/15 text-red-400'
            )}
          >
            <span className="text-lg">{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value).toFixed(2)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
