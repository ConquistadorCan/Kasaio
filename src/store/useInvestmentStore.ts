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
  updateInvestmentTransaction: (txn: InvestmentTransaction) => void;
  removeInvestmentTransaction: (id: number) => void;
  refreshHolding: (holding: Holding) => void;
  removeHolding: (assetId: number) => void;
  refreshAsset: (asset: Asset) => void;
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
  updateInvestmentTransaction: (txn) =>
    set((s) => ({
      investmentTransactions: s.investmentTransactions.map((t) => (t.id === txn.id ? txn : t)),
    })),
  removeInvestmentTransaction: (id) =>
    set((s) => ({
      investmentTransactions: s.investmentTransactions.filter((t) => t.id !== id),
    })),
  refreshHolding: (holding) =>
    set((s) => {
      const exists = s.holdings.some((h) => h.asset_id === holding.asset_id);
      return {
        holdings: exists
          ? s.holdings.map((h) => (h.asset_id === holding.asset_id ? holding : h))
          : [...s.holdings, holding],
      };
    }),
  removeHolding: (assetId) =>
    set((s) => ({ holdings: s.holdings.filter((h) => h.asset_id !== assetId) })),
  refreshAsset: (asset) =>
    set((s) => ({ assets: s.assets.map((a) => (a.id === asset.id ? asset : a)) })),
}));