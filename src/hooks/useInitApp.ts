import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store/useAppStore";

export function useInitApp() {
  const setApiPort = useAppStore((s) => s.setApiPort);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const port = await invoke<number>("get_api_port");
        setApiPort(port);
        setReady(true);
      } catch (err) {
        setError("Failed to connect to backend.");
        console.error(err);
      }
    }

    init();
  }, [setApiPort]);

  return { ready, error };
}