import { apiClient } from './client';
import { unwrapApiResponse } from './utils';
import type { User } from '@/types';

export const getUser = async (): Promise<User> => {
  const response = await apiClient.get('/user/me');
  return unwrapApiResponse<User>(response.data);
};

export const updateUser = async (updates: Partial<User>): Promise<User> => {
  const response = await apiClient.put('/user/me', updates);
  return unwrapApiResponse<User>(response.data);
};

export const getConfig = async (): Promise<{
  DEFAULT_SPARSITY: number;
  DEVIATION_THRESHOLD: number;
  MAX_POSITION_SIZE: number;
  DATA_START_DATE: string;
  DATA_END_DATE: string;
}> => {
  const response = await apiClient.get('/user/config');
  return unwrapApiResponse(response.data);
};

export const updateConfig = async (config: Record<string, any>): Promise<void> => {
  await apiClient.put('/user/config', config);
};
