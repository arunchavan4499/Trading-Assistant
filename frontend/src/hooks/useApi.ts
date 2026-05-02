import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as marketDataApi from '@/api/marketData';
import * as featuresApi from '@/api/features';
import * as portfolioApi from '@/api/portfolio';
import * as signalsApi from '@/api/signals';
import * as backtestApi from '@/api/backtest';
import * as riskApi from '@/api/risk';
import * as userApi from '@/api/user';
import type {
  ConstructPortfolioRequest,
  GenerateRebalanceRequest,
  BacktestConfig,
  RiskValidationRequest,
} from '@/types';

// Market Data Hooks
export const useOHLCV = (symbols: string[], startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['ohlcv', symbols, startDate, endDate],
    queryFn: () => marketDataApi.getOHLCV(symbols, startDate, endDate),
    enabled: symbols.length > 0,
  });
};

export const useFetchOHLCV = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketDataApi.fetchOHLCV,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ohlcv'] });
    },
  });
};

// Features Hooks
export const useComputeFeatures = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: featuresApi.computeFeatures,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      queryClient.invalidateQueries({ queryKey: ['feature-correlations'] });
    },
  });
};

export const useFeatures = (symbol?: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['features', symbol, startDate, endDate],
    queryFn: () => featuresApi.getFeatures(symbol!, startDate, endDate),
    enabled: !!symbol,
  });
};

export const useFeatureCorrelations = (symbols: string[], startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['feature-correlations', symbols, startDate, endDate],
    queryFn: () => featuresApi.getFeatureCorrelations(symbols, startDate, endDate),
    enabled: symbols.length > 0,
  });
};

// VAR Diagnostics Hook
export const useVARDiagnostics = () => {
  return useQuery({
    queryKey: ['var-diagnostics'],
    queryFn: async () => {
      const runs = await portfolioApi.getVARRuns();
      if (runs && runs.length > 0) {
        return runs[0].diagnostics;
      }
      return null;
    },
  });
};

export const useRunVAR = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: portfolioApi.runVARPipeline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['var-diagnostics'] });
      queryClient.invalidateQueries({ queryKey: ['var-runs'] });
    },
  });
};

// Portfolio Hooks
export const useConstructPortfolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ConstructPortfolioRequest) => portfolioApi.constructPortfolio(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-runs'] });
    },
  });
};

export const usePortfolioRuns = () => {
  return useQuery({
    queryKey: ['portfolio-runs'],
    queryFn: portfolioApi.getPortfolioRuns,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always consider stale so refetch on invalidation
  });
};

export const usePortfolioRun = (runId: number) => {
  return useQuery({
    queryKey: ['portfolio-run', runId],
    queryFn: () => portfolioApi.getPortfolioRun(runId),
    enabled: runId > 0,
  });
};

export const useVARRuns = () => {
  return useQuery({
    queryKey: ['var-runs'],
    queryFn: portfolioApi.getVARRuns,
  });
};

// Signals Hooks
export const useGenerateRebalance = () => {
  return useMutation({
    mutationFn: (request: GenerateRebalanceRequest) => signalsApi.generateRebalancePlan(request),
  });
};

export const useGenerateSignal = () => {
  return useMutation({
    mutationFn: signalsApi.generateSimpleSignal,
  });
};

// Backtest Hooks
export const useRunBacktest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: BacktestConfig) => backtestApi.runBacktest(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtest-runs'] });
    },
  });
};

export const useBacktestRuns = () => {
  return useQuery({
    queryKey: ['backtest-runs'],
    queryFn: backtestApi.getBacktestRuns,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always consider stale so refetch on invalidation
  });
};

export const useBacktestResult = (backtestId: number) => {
  return useQuery({
    queryKey: ['backtest-result', backtestId],
    queryFn: () => backtestApi.getBacktestResult(backtestId),
    enabled: backtestId > 0,
  });
};

// Risk Hooks
export const useValidateRisk = () => {
  return useMutation({
    mutationFn: (request: RiskValidationRequest) => riskApi.validateRisk(request),
  });
};

export const useRiskStatus = () => {
  return useQuery({
    queryKey: ['risk-status'],
    queryFn: riskApi.getRiskStatus,
    refetchInterval: 30000, // Refresh every 30s
    staleTime: 0, // Always consider stale so refetch on window focus
  });
};

export const useRiskLimits = () => {
  return useQuery({
    queryKey: ['risk-limits'],
    queryFn: riskApi.getRiskLimits,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always consider stale so refetch immediately on invalidation
  });
};

// User Hooks
export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: userApi.getUser,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['risk-limits'] }); // Invalidate risk limits when user updates
      queryClient.invalidateQueries({ queryKey: ['risk-status'] }); // Invalidate risk status when user updates
      queryClient.invalidateQueries({ queryKey: ['portfolio-runs'] }); // Invalidate portfolio runs to reflect new limits
      queryClient.invalidateQueries({ queryKey: ['backtest-runs'] }); // Invalidate backtest runs to reflect new limits
    },
  });
};

export const useConfig = () => {
  return useQuery({
    queryKey: ['config'],
    queryFn: userApi.getConfig,
  });
};
