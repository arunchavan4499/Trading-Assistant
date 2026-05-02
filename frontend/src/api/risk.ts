import { apiClient } from './client';
import { unwrapApiResponse } from './utils';
import type { RiskStatus, RiskValidationRequest, RiskLimits } from '@/types';

export const validateRisk = async (request: RiskValidationRequest): Promise<RiskStatus> => {
  const response = await apiClient.post('/risk/validate', request);
  return unwrapApiResponse<RiskStatus>(response.data);
};

export const getRiskStatus = async (): Promise<RiskStatus> => {
  const response = await apiClient.get('/risk/status');
  return unwrapApiResponse<RiskStatus>(response.data);
};

export const getRiskLimits = async (): Promise<RiskLimits> => {
  const response = await apiClient.get('/risk/limits');
  const data = unwrapApiResponse<{ limits: RiskLimits }>(response.data);
  return data.limits;
};

export const updateRiskLimits = async (limits: Partial<RiskLimits>): Promise<RiskLimits> => {
  const response = await apiClient.put('/risk/limits', limits);
  const data = unwrapApiResponse<{ limits: RiskLimits }>(response.data);
  return data.limits;
};

export const getDrawdownHistory = async (
  start_date?: string,
  end_date?: string
): Promise<{ date: string; drawdown: number }[]> => {
  const response = await apiClient.get('/risk/drawdown-history', {
    params: { start_date, end_date },
  });
  const data = unwrapApiResponse<{ history: { date: string; drawdown: number }[] }>(response.data);
  return data.history ?? [];
};
