export type AssetType = "COMMODITY" | "CRYPTOCURRENCY" | "TEFAS_FUND" | "ETF" | "EUROBOND";
export type InvestmentTransactionType = "BUY" | "SELL" | "INCOME";
export type Currency = "TRY" | "USD";

export interface Asset {
  id: number;
  symbol: string;
  name: string;
  asset_type: AssetType;
  currency: Currency;
}

export interface Holding {
  id: number;
  asset_id: number;
  quantity: number;
  average_cost: number;
  cost_basis: number;
  current_value: number | null;
  pnl: number | null;
  pnl_pct: number | null;
}

export interface InvestmentTransaction {
  id: number;
  asset_id: number;
  transaction_type: InvestmentTransactionType;
  quantity: number;
  price: number;
  date: string;
}

export interface AssetPrice {
  id: number;
  asset_id: number;
  price: number;
  recorded_at: string;
}

export interface ExchangeRate {
  id: number;
  currency: Currency;
  rate: number;
  recorded_at: string;
}

export interface PortfolioHolding {
  asset: Asset;
  quantity: number;
  average_cost: number;
  cost_basis: number;
  cost_basis_try: number | null;
  current_price: number | null;
  current_price_try: number | null;
  current_value: number | null;
  current_value_try: number | null;
  pnl: number | null;
  pnl_try: number | null;
  pnl_pct: number | null;
}

export interface PortfolioSummary {
  holdings: PortfolioHolding[];
  total_cost_try: number | null;
  total_current_value_try: number | null;
  total_pnl_try: number | null;
  total_pnl_pct: number | null;
}