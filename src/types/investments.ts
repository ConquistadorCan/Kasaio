export type AssetType = "COMMODITY";
export type InvestmentTransactionType = "BUY" | "SELL";

export interface Asset {
  id: number;
  symbol: string;
  name: string;
  asset_type: AssetType;
}

export interface Holding {
  id: number;
  asset_id: number;
  quantity: number;
  average_cost: number;
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