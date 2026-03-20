import { useEffect, useState, useCallback } from "react";
import { listen, emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store/useAppStore";
import { useInvestmentStore } from "../store/useInvestmentStore";
import { transactionsApi } from "../api/transactions";
import { categoriesApi } from "../api/categories";
import { assetsApi } from "../api/assets";
import { holdingsApi } from "../api/holdings";
import { assetPricesApi } from "../api/assetPrices";
import { logError } from "../lib/logger";

const POLL_INTERVAL_MS = 1000;
const POLL_MAX_RETRIES = 3;

async function waitForPort(): Promise<number> {
  await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

  for (let attempt = 1; attempt <= POLL_MAX_RETRIES; attempt++) {
    const port = await invoke<number>("get_api_port");
    if (port !== 0) return port;
    if (attempt < POLL_MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }

  throw new Error("Backend did not start in time.");
}

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

        await emit("frontend_ready");

        const port = await waitForPort();
        if (loaded) return;
        loaded = true;
        unlisten?.();
        unlistenFailed?.();
        await loadData(port);
      } catch (err) {
        if (!loaded) await handleError(err);
      }
    }

    init();

    return () => { unlisten?.(); unlistenFailed?.(); };
  }, [loadData, handleError]);

  return { ready, error };
}