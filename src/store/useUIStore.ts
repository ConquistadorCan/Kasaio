import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WalletView = "TRY" | "USD";

interface UIStore {
  walletView: WalletView;
  setWalletView: (v: WalletView) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      walletView: "TRY",
      setWalletView: (walletView) => set({ walletView }),
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      settingsOpen: false,
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
    }),
    {
      name: "kasaio-ui",
      partialize: (s) => ({ walletView: s.walletView, sidebarOpen: s.sidebarOpen }),
    }
  )
);
