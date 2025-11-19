export interface UsageEvent {
  date: string;
  kind: string;
  model: string;
  maxMode: string;
  inputWithCache: number;
  inputWithoutCache: number;
  cacheRead: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

export type TimeRange = '1d' | '7d' | '30d';

export interface DailyStat {
  date: string;
  totalCost: number;
  [model: string]: number | string; // Dynamic keys for model costs
}



