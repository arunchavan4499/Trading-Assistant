import { apiClient } from './client';
import { unwrapApiResponse } from './utils';
import type {
  GenerateRebalanceRequest,
  RebalancePlan,
  SimpleSignal,
  PortfolioWeights,
} from '@/types';

export interface GenerateSimpleSignalRequest {
  current_value: number;
  target_value: number;
  portfolio: PortfolioWeights;
  deviation_threshold?: number;
}

export const generateRebalancePlan = async (
  request: GenerateRebalanceRequest
): Promise<RebalancePlan> => {
  const response = await apiClient.post('/signals/rebalance', request);
  return unwrapApiResponse<RebalancePlan>(response.data);
};

export const generateSimpleSignal = async (
  request: GenerateSimpleSignalRequest
): Promise<SimpleSignal> => {
  const response = await apiClient.post('/signals/simple', request);
  return unwrapApiResponse<SimpleSignal>(response.data);
};

export const getLatestSignal = async (portfolioRunId: number): Promise<SimpleSignal> => {
  const response = await apiClient.get(`/signals/${portfolioRunId}/latest`);
  return unwrapApiResponse<SimpleSignal>(response.data);
};

export const calculatePortfolioValue = async (
  portfolio: PortfolioWeights,
  prices: Record<string, number>
): Promise<number> => {
  const response = await apiClient.post('/signals/portfolio-value', {
    portfolio,
    prices,
  });
  const data = unwrapApiResponse<{ value: number }>(response.data);
  return data.value ?? 0;
};
