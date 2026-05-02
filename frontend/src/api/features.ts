import { apiClient } from './client';
import { unwrapApiResponse } from './utils';
import type { FeatureResponse, FeatureData } from '@/types';

export interface ComputeFeaturesParams {
  symbols: string[];
  start_date: string;
  end_date: string;
  save?: boolean;
}

export const computeFeatures = async (params: ComputeFeaturesParams): Promise<FeatureResponse> => {
  const response = await apiClient.post('/features/compute', params);
  return unwrapApiResponse<FeatureResponse>(response.data);
};

export const getFeatures = async (
  symbol: string,
  start_date?: string,
  end_date?: string
): Promise<FeatureData[]> => {
  const response = await apiClient.get(`/features/${symbol}`, {
    params: { start_date, end_date },
  });
  const data = unwrapApiResponse<{ symbol: string; features: FeatureData[] }>(response.data);
  return data?.features ?? [];
};

export const getFeatureNames = async (): Promise<string[]> => {
  const response = await apiClient.get('/features/names');
  const data = unwrapApiResponse<{ feature_names: string[] }>(response.data);
  return data.feature_names ?? [];
};

export const getFeatureCorrelations = async (
  symbols: string[],
  start_date: string,
  end_date: string
): Promise<Record<string, Record<string, number>>> => {
  const response = await apiClient.post('/features/correlations', {
    symbols,
    start_date,
    end_date,
  });
  const data = unwrapApiResponse<{ correlations: Record<string, Record<string, number>> }>(response.data);
  return data.correlations ?? {};
};
