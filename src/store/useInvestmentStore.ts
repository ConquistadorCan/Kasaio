import { create } from "zustand";
import type { Asset, Holding, InvestmentTransaction, AssetPrice } from "../types/investments";

interface InvestmentStore {
  assets: Asset[];
  holdings: Holding[];
  investmentTransactions: InvestmentTransaction[];
  latestPrices: Record<number, AssetPrice>;

  setAssets: (assets: Asset[]) => void;
  setHoldings: (holdings: Holding[]) => void;
  setInvestmentTransactions: (txns: InvestmentTransaction[]) => void;
  setLatestPrice: (assetId: number, price: AssetPrice) => void;
  addInvestmentTransaction: (txn: InvestmentTransaction) => void;
  refreshHolding: (holding: Holding) => void;
}

export const useInvestmentStore = create<InvestmentStore>((set) => ({
  assets: [],
  holdings: [],
  investmentTransactions: [],
  latestPrices: {},

  setAssets: (assets) => set({ assets }),
  setHoldings: (holdings) => set({ holdings }),
  setInvestmentTransactions: (investmentTransactions) => set({ investmentTransactions }),
  setLatestPrice: (assetId, price) =>
    set((s) => ({ latestPrices: { ...s.latestPrices, [assetId]: price } })),
  addInvestmentTransaction: (txn) =>
    set((s) => ({ investmentTransactions: [txn, ...s.investmentTransactions] })),
  refreshHolding: (holding) =>
    set((s) => ({
      holdings: s.holdings.map((h) => (h.asset_id === holding.asset_id ? holding : h)),
    })),
}));