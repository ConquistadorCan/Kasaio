import { useEffect, useState, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store/useAppStore";
import { useInvestmentStore } from "../store/useInvestmentStore";
import { transactionsApi } from "../api/transactions";
import { categoriesApi } from "../api/categories";
import { assetsApi } from "../api/assets";
import { holdingsApi } from "../api/holdings";
import { assetPricesApi } from "../api/assetPrices";
import { logError } from "../lib/logger";

export function useInitApp() {
  const { setApiPort, setTransactions, setCategories } = useAppStore();
  const { setAssets, setHoldings, setLatestPrice } = useInvestmentStore();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (port: number) => {
    setApiPort(port);

    const [txns, cats, assets, holdings] = await Promise.all([
      transactionsApi.list(),
      categoriesApi.list(),
      assetsApi.list(),
      holdingsApi.list(),
    ]);
    setTransactions(txns);
    setCategories(cats);
    setAssets(assets);
    setHoldings(holdings);

    await Promise.all(
      assets.map(async (a) => {
        try {
          const latest = await assetPricesApi.latest(a.id);
          setLatestPrice(a.id, latest);
        } catch {
          // asset has no price yet, not an error worth logging
        }
      })
    );

    setReady(true);
  }, [setApiPort, setTransactions, setCategories, setAssets, setHoldings, setLatestPrice]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function init() {
      try {
        unlisten = await listen<number>("backend-ready", async (event) => {
          await loadData(event.payload);
        });

        const port = await invoke<number>("get_api_port");
        await loadData(port);
      } catch (err) {
        await logError("Failed to initialize app", err);
        setError("Failed to connect to backend.");
      }
    }

    init();

    return () => { unlisten?.(); };
  }, [loadData]);

  return { ready, error };
}