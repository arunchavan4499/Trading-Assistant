import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageLoader } from '@/components/loaders/Loader';
import { ErrorDisplay } from '@/components/loaders/ErrorDisplay';
import { useBacktestRuns } from '@/hooks/useApi';
import { downloadBacktestReport } from '@/api/backtest';
import { Download, FileText } from 'lucide-react';

export default function Reports() {
  const { data: backtestRuns, isLoading, error } = useBacktestRuns();

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorDisplay message="Failed to load backtest reports" />;

  const handleDownload = async (runId: number, format: 'json' | 'csv') => {
    const blob = await downloadBacktestReport(runId, format);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backtest-${runId}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-clash text-3xl font-bold text-slate-900 dark:text-white">Reports</h1>
        <p className="text-slate-500 dark:text-slate-400">Download and review backtest results</p>
      </div>

      {/* Backtest Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Backtest Run History
          </CardTitle>
          <CardDescription>Historical backtest results and configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Sharpe</TableHead>
                <TableHead>Ann. Return</TableHead>
                <TableHead>Max DD</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backtestRuns?.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">#{run.id}</TableCell>
                  <TableCell>
                    {run.created_at
                      ? new Date(run.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {run.config?.start_date} to {run.config?.end_date}
                  </TableCell>
                  <TableCell>{run.metrics?.sharpe?.toFixed(2) || 'N/A'}</TableCell>
                  <TableCell className="text-green-400">
                    {run.metrics?.ann_return
                      ? `${(run.metrics.ann_return * 100).toFixed(2)}%`
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-red-400">
                    {run.metrics?.max_drawdown
                      ? `${(run.metrics.max_drawdown * 100).toFixed(2)}%`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(run.id, 'json')}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(run.id, 'csv')}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        CSV
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
          <CardDescription>Aggregate metrics across all backtests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Runs</p>
              <p className="font-clash text-2xl font-bold text-slate-900 dark:text-white">{backtestRuns?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Sharpe</p>
              <p className="font-clash text-2xl font-bold text-slate-900 dark:text-white">
                {backtestRuns && backtestRuns.length > 0
                  ? (
                    backtestRuns
                      .filter((r) => r.metrics?.sharpe)
                      .reduce((sum, r) => sum + (r.metrics?.sharpe || 0), 0) /
                    backtestRuns.filter((r) => r.metrics?.sharpe).length
                  ).toFixed(2)
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Best Return</p>
              <p className="font-clash text-2xl font-bold text-green-600 dark:text-green-400">
                {backtestRuns && backtestRuns.length > 0
                  ? `${(
                    Math.max(
                      ...backtestRuns.map((r) => r.metrics?.ann_return || 0)
                    ) * 100
                  ).toFixed(2)}%`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Worst DD</p>
              <p className="font-clash text-2xl font-bold text-red-500 dark:text-red-400">
                {backtestRuns && backtestRuns.length > 0
                  ? `${(
                    Math.min(
                      ...backtestRuns.map((r) => r.metrics?.max_drawdown || 0)
                    ) * 100
                  ).toFixed(2)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export All */}
      <Card>
        <CardHeader>
          <CardTitle>Export All Data</CardTitle>
          <CardDescription>Download complete dataset for offline analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full md:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Download All Backtest Results (JSON)
          </Button>
          <Button variant="outline" className="w-full md:w-auto ml-0 md:ml-2">
            <Download className="mr-2 h-4 w-4" />
            Download Portfolio History (CSV)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
