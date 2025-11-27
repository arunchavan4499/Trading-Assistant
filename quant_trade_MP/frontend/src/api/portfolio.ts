import { apiClient } from './client';
import { unwrapApiResponse } from './utils';
import type {
  ConstructPortfolioRequest,
  ConstructPortfolioResponse,
  PortfolioRun,
  VARRun,
  VARDiagnostics,
} from '@/types';

export interface RunVARParams {
  symbols: string[];
  start_date: string;
  end_date: string;
  ridge_lambda?: number;
  auto_ridge?: boolean;
  rolling_window?: number;
  persist_outputs?: boolean;
  save_db_record?: boolean;
  run_name?: string;
}

export interface VARResult {
  diagnostics: VARDiagnostics;
  run_id?: number;
  persisted_paths?: {
    a_csv: string;
    cov_csv: string;
    std_parquet: string;
    diag_json: string;
  };
}

export const runVARPipeline = async (params: RunVARParams): Promise<VARResult> => {
  const response = await apiClient.post('/portfolio/var/run', params);
  return unwrapApiResponse<VARResult>(response.data);
};

export const getVARRuns = async (): Promise<VARRun[]> => {
  const response = await apiClient.get('/portfolio/var/runs');
  const data = unwrapApiResponse<{ runs: VARRun[] }>(response.data);
  return data.runs ?? [];
};

export const getVARRun = async (runId: number): Promise<VARRun> => {
  const response = await apiClient.get(`/portfolio/var/runs/${runId}`);
  return unwrapApiResponse<VARRun>(response.data);
};

export const constructPortfolio = async (
  request: ConstructPortfolioRequest
): Promise<ConstructPortfolioResponse> => {
  const response = await apiClient.post('/portfolio/construct', request);
  return unwrapApiResponse<ConstructPortfolioResponse>(response.data);
};

export const getPortfolioRuns = async (): Promise<PortfolioRun[]> => {
  const response = await apiClient.get('/portfolio/runs');
  const data = unwrapApiResponse<{ runs: PortfolioRun[] }>(response.data);
  return data.runs ?? [];
};

export const getPortfolioRun = async (runId: number): Promise<PortfolioRun> => {
  const response = await apiClient.get(`/portfolio/runs/${runId}`);
  return unwrapApiResponse<PortfolioRun>(response.data);
};

export const deletePortfolioRun = async (runId: number): Promise<void> => {
  await apiClient.delete(`/portfolio/runs/${runId}`);
};

export const getCovariance = async (
  symbols: string[],
  start_date: string,
  end_date: string
): Promise<number[][]> => {
  const response = await apiClient.post('/portfolio/covariance', {
    symbols,
    start_date,
    end_date,
  });
  const data = unwrapApiResponse<{ covariance_matrix: number[][] }>(response.data);
  return data.covariance_matrix ?? [];
};
