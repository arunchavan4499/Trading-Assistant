// Market Data Types
export interface OHLCVData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adj_close: number;
  volume: number;
}

export interface OHLCVResponse {
  data: Record<string, OHLCVData[]>;
  symbols: string[];
  date_range: {
    start_date: string;
    end_date: string;
  };
  record_count: Record<string, number>;
}

export interface SymbolSuggestion {
  symbol: string;
  ticker?: string;
  name?: string;
  exchange?: string;
  type?: string;
  sector?: string;
  score?: number;
}

// Feature Types
export interface FeatureData {
  date: string;
  [feature: string]: number | string;
}

export interface FeatureResponse {
  symbol: string;
  features: FeatureData[];
  feature_names: string[];
}

// Portfolio Types
export interface PortfolioWeights {
  [symbol: string]: number;
}

export interface PCOptions {
  method: 'mean_variance' | 'minvar' | 'sparse_mean_reverting';
  max_weight: number;
  min_weight: number;
  allow_short: boolean;
  risk_aversion: number;
  sparsity_k: number;
  sparsity_keep_signed: boolean;
  cov_ridge: number;
  persist: boolean;
  run_name?: string;
}

export interface PortfolioMetrics {
  expected_return?: number;
  variance?: number;
  std_dev?: number;
  sharpe_ratio?: number;
  portfolio_std?: number;
  n_assets?: number;
  num_assets?: number;
  cov_matrix?: number[][];
  chosen_eig_index?: number;
  chosen_eig_value?: number;
  selected_symbols?: string[];
}

export interface PortfolioRun {
  id: number;
  run_name: string;
  symbols: string[];
  weights: PortfolioWeights;
  method: string;
  metrics: PortfolioMetrics;
  created_at: string;
  current_equity?: number;
  peak_equity?: number;
}

export interface ConstructPortfolioRequest {
  symbols: string[];
  start_date: string;
  end_date: string;
  ridge_lambda?: number;
  options: PCOptions;
}

export interface ConstructPortfolioResponse {
  weights: PortfolioWeights;
  metrics: PortfolioMetrics;
  run_id?: number;
  method?: string;
  created_at?: string;
}

// Signal Types
export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
}

export interface TradeDetail {
  side: SignalType;
  target_notional: number;
  current_notional: number;
  notional_diff: number;
  deviation: number;
  quantity: number;
}

export interface RebalancePlan {
  trades: Record<string, TradeDetail>;
  summary: {
    current_value: number;
    target_value: number;
    l1_deviation: number;
    action: string;
  };
}

export interface SimpleSignal {
  signal: SignalType;
  deviation: number;
  current_value: number;
  target_value: number;
  message: string;
  portfolio: PortfolioWeights;
}

export interface GenerateRebalanceRequest {
  target_weights: PortfolioWeights;
  current_qty: Record<string, number>;
  prices: Record<string, number>;
  cash?: number;
  capital?: number;
  current_equity?: number;
  peak_equity?: number;
}

// Backtest Types
export interface BacktestConfig {
  symbols: string[];
  start_date: string;
  end_date: string;
  rebalance_freq: string; // '1D', '7D', '30D'
  rebalance_freq_days?: number;
  weights?: PortfolioWeights;
  commission_rate?: number;
  slippage_pct?: number;
  turnover_cost_pct?: number;
  sparsity_k?: number;
  max_weight?: number;
  initial_capital?: number;
}

export interface BacktestMetrics {
  sharpe?: number;
  sortino?: number;
  max_drawdown?: number;
  annual_return?: number;
  annual_vol?: number;
  ann_return?: number;
  ann_vol?: number;
  cum_return?: number;
  total_return?: number;
  n_periods?: number;
  num_trades?: number;
  winning_trades?: number;
  losing_trades?: number;
  avg_win?: number;
  avg_loss?: number;
  final_value?: number;
  initial_capital?: number;
}

export interface BacktestEquityPoint {
  date: string;
  equity: number;
  cash: number;
  positions_value: number;
}

export interface BacktestTradeRecord {
  date: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  notional: number;
  fees_and_slippage: number;
}

export interface BacktestResult {
  run_id?: number | null;
  config: BacktestConfig;
  metrics: BacktestMetrics;
  equity_curve: BacktestEquityPoint[];
  trades: BacktestTradeRecord[];
  created_at: string;
}

// Risk Types
export interface RiskLimits {
  max_drawdown?: number;
  max_position_fraction?: number;
  max_position_size?: number;
  min_cash_buffer?: number;
  max_leverage?: number;
  max_portfolio_exposure?: number;
  use_half_kelly?: boolean;
  max_assets?: number;
  user_name?: string;
  user_email?: string;
}

export interface RiskStatus {
  current_drawdown: number;
  peak_equity: number;
  current_equity: number;
  position_sizes: Record<string, number>;
  exposures: {
    long: number;
    short: number;
    net: number;
  };
  violations: string[];
  approved: boolean;
  drawdown_limit?: number;
  is_safe?: boolean;
  message?: string;
  position_limits?: Record<string, number>;
}

export interface RiskValidationRequest {
  weights: PortfolioWeights;
  current_equity: number;
  peak_equity: number;
  limits?: RiskLimits;
}

// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  risk_tolerance: number;
  capital: number;
  max_assets: number;
  drawdown_limit: number;
  created_at: string;
}

// VAR Types
export interface VARDiagnostics {
  n_obs: number;
  n_assets: number;
  eigenvalues: number[];
  used_ridge_lambda: number;
  cond_XtX: number;
  asset_order: string[];
  dropped_assets: string[];
  timestamp: number;
}

export interface VARRun {
  id: number;
  run_name: string;
  symbols: string[];
  diagnostics: VARDiagnostics;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  detail?: string;
  timestamp: string;
}

// Job/Progress Types
export interface JobStatus {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: any;
  error?: string;
}
