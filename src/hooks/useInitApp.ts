import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../store/useAppStore";

export function useInitApp() {
  const setApiPort = useAppStore((s) => s.setApiPort);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function init() {
      try {
        unlisten = await listen<number>("backend-ready", (event) => {
          setApiPort(event.payload);
          setReady(true);
        });
      } catch (err) {
        setError("Failed to connect to backend.");
        console.error(err);
      }
    }

    init();

    return () => {
      unlisten?.();
    };
  }, [setApiPort]);

  return { ready, error };
}
