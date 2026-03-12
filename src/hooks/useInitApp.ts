import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store/useAppStore";
import { transactionsApi } from "../api/transactions";
import { categoriesApi } from "../api/categories";
import { logError } from "../lib/logger";

export function useInitApp() {
  const { setApiPort, setTransactions, setCategories } = useAppStore();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const port = await invoke<number>("get_api_port");
        setApiPort(port);

        const [txns, cats] = await Promise.all([
          transactionsApi.list(),
          categoriesApi.list(),
        ]);
        setTransactions(txns);
        setCategories(cats);

        setReady(true);
      } catch (err) {
        await logError("Failed to initialize app", err);
        setError("Failed to connect to backend.");
      }
    }

    init();
  }, [setApiPort, setTransactions, setCategories]);

  return { ready, error };
}
