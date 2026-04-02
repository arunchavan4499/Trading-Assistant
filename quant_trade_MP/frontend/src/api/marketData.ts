import { apiClient } from './client';
import { unwrapApiResponse } from './utils';
import type { OHLCVResponse, SymbolSuggestion } from '@/types';

export interface FetchOHLCVParams {
  symbols: string[];
  start_date: string;
  end_date: string;
  save_to_db?: boolean;
}

export const fetchOHLCV = async (params: FetchOHLCVParams): Promise<OHLCVResponse> => {
  const response = await apiClient.post('/data/fetch', params);
  return unwrapApiResponse<OHLCVResponse>(response.data);
};

export const getOHLCV = async (
  symbols: string[],
  start_date: string,
  end_date: string
): Promise<OHLCVResponse> => {
  const response = await apiClient.get('/data/ohlcv', {
    params: { symbols: symbols.join(','), start_date, end_date },
  });
  return unwrapApiResponse<OHLCVResponse>(response.data);
};

export const getDataSummary = async (): Promise<{
  symbols: string[];
  coverage: Record<string, { start: string; end: string; count: number }>;
  missing_counts: Record<string, number>;
}> => {
  const response = await apiClient.get('/data/summary');
  return unwrapApiResponse(response.data);
};

export const getAvailableSymbols = async (): Promise<string[]> => {
  const response = await apiClient.get('/data/symbols');
  const data = unwrapApiResponse<{ symbols: string[] }>(response.data);
  return data.symbols ?? [];
};

export const searchSymbols = async (query: string, limit = 8): Promise<SymbolSuggestion[]> => {
  const response = await apiClient.get('/data/search', {
    params: { query, limit },
  });
  const data = unwrapApiResponse<{ suggestions: SymbolSuggestion[] }>(response.data);
  return data.suggestions ?? [];
};
