export type AssetType = "COMMODITY" | "CRYPTOCURRENCY" | "TEFAS_FUND" | "ETF" | "EUROBOND";
export type InvestmentTransactionType = "BUY" | "SELL" | "INCOME";
export type Currency = "TRY" | "USD";

export interface Asset {
  id: number;
  symbol: string;
  name: string;
  asset_type: AssetType;
  currency: Currency;
  maturity_date?: string | null;
  coupon_rate?: number | null;
  coupon_frequency?: number | null;
  first_coupon_date?: string | null;
  face_value?: number | null;
}

export interface Holding {
  id: number;
  asset_id: number;
  quantity: number;
  average_cost: number;
  realized_pnl: number;
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

export interface PortfolioHolding {
  asset: Asset;
  quantity: number;
  average_cost: number;
  realized_pnl: number;
  cost_basis: number;
  current_price: number | null;
  current_value: number | null;
  pnl: number | null;
  pnl_pct: number | null;
}

export interface PortfolioSummary {
  holdings: PortfolioHolding[];
}
