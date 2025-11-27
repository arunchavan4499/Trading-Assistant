import { apiClient } from './client';
import { unwrapApiResponse } from './utils';
import type {
  BacktestConfig,
  BacktestResult,
  BacktestMetrics,
  BacktestEquityPoint,
  BacktestTradeRecord,
} from '@/types';

export interface BacktestRun {
  id: number;
  run_name: string;
  symbols: string[];
  config: BacktestConfig;
  metrics: BacktestMetrics;
  equity_curve?: BacktestEquityPoint[];
  trades?: BacktestTradeRecord[];
  created_at: string;
}

export const runBacktest = async (config: BacktestConfig): Promise<BacktestResult> => {
  const response = await apiClient.post('/backtest/run', config);
  return unwrapApiResponse<BacktestResult>(response.data);
};

export const getBacktestRuns = async (): Promise<BacktestRun[]> => {
  const response = await apiClient.get('/backtest/runs');
  const data = unwrapApiResponse<{ runs: BacktestRun[] }>(response.data);
  return data.runs ?? [];
};

export const getBacktestResult = async (backtestId: number): Promise<BacktestResult> => {
  const response = await apiClient.get(`/backtest/results/${backtestId}`);
  return unwrapApiResponse<BacktestResult>(response.data);
};

export const getBacktestStatus = async (jobId: string): Promise<{
  status: string;
  progress: number;
  message?: string;
}> => {
  const response = await apiClient.get(`/backtest/status/${jobId}`);
  return unwrapApiResponse(response.data);
};

export const downloadBacktestReport = async (backtestId: number): Promise<Blob> => {
  const response = await apiClient.get(`/backtest/download/${backtestId}`, {
    responseType: 'blob',
  });
  return response.data;
};
