import { useEffect, useState, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store/useAppStore";
import { useInvestmentStore } from "../store/useInvestmentStore";
import { useBESStore } from "../store/useBESStore";
import { transactionsApi } from "../api/transactions";
import { categoriesApi } from "../api/categories";
import { assetsApi } from "../api/assets";
import { holdingsApi } from "../api/holdings";
import { investmentTransactionsApi } from "../api/investmentTransactions";
import { assetPricesApi } from "../api/assetPrices";
import { besApi } from "../api/bes";
import { logError, logInfo } from "../lib/logger";
import { ApiError } from "../lib/api";

export function useInitApp() {
  const { setApiPort, setTransactions, setCategories } = useAppStore();
  const { setAssets, setHoldings, setLatestPrice, setInvestmentTransactions } = useInvestmentStore();
  const { setPlans: setBESPlans } = useBESStore();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (port: number) => {
    setApiPort(port);

    const [txns, cats, assets, holdings, investmentTxns, besPlans] = await Promise.all([
      transactionsApi.list(),
      categoriesApi.list(),
      assetsApi.list(),
      holdingsApi.list(),
      investmentTransactionsApi.list(),
      besApi.listPlans(),
    ]);
    setTransactions(txns);
    setCategories(cats);
    setAssets(assets);
    setHoldings(holdings);
    setInvestmentTransactions(investmentTxns);
    setBESPlans(besPlans);

    await Promise.all(
      assets.map(async (a) => {
        try {
          const latest = await assetPricesApi.latest(a.id);
          setLatestPrice(a.id, latest);
        } catch (err) {
          if (!(err instanceof ApiError && err.status === 404)) {
            logError(`Failed to load price for asset ${a.id}`, err);
          }
        }
      })
    );

    logInfo("App initialized successfully");
    setReady(true);
  }, [setApiPort, setTransactions, setCategories, setAssets, setHoldings, setLatestPrice, setInvestmentTransactions, setBESPlans]);

  const handleError = useCallback(async (err: unknown) => {
    await logError("Failed to initialize app", err);
    setError("Failed to connect to backend.");
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let unlistenFailed: (() => void) | undefined;
    let loaded = false;

    async function init() {
      try {
        unlisten = await listen<number>("backend_ready", async (event) => {
          if (loaded) return;
          loaded = true;
          unlisten?.();
          unlistenFailed?.();
          await loadData(event.payload).catch(handleError);
        });

        unlistenFailed = await listen<string>("backend_failed", async (event) => {
          if (loaded) return;
          loaded = true;
          unlisten?.();
          unlistenFailed?.();
          await logError("Backend failed to start", event.payload);
          setError("Failed to connect to backend.");
        });

        await invoke("frontend_ready");

        const port = await invoke<number>("get_api_port");
        if (port !== 0) {
          if (loaded) return;
          loaded = true;
          unlisten?.();
          unlistenFailed?.();
          await loadData(port).catch(handleError);
          return;
        }

        const backendError = await invoke<string | null>("get_backend_error");
        if (backendError) {
          if (loaded) return;
          loaded = true;
          unlisten?.();
          unlistenFailed?.();
          await logError("Backend failed to start", backendError);
          setError("Failed to connect to backend.");
        }
      } catch (err) {
        if (!loaded) {
          loaded = true;
          await handleError(err);
        }
      }
    }

    init();

    return () => { unlisten?.(); unlistenFailed?.(); };
  }, [loadData, handleError]);

  return { ready, error };
}
