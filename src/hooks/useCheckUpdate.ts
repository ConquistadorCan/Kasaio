import { useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { logError } from "../lib/logger";

export function useCheckUpdate() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) return;

    async function checkForUpdate() {
      try {
        const result = await check();
        if (result) setUpdate(result);
      } catch (err) {
        await logError("Update check failed", err);
      }
    }

    checkForUpdate();
  }, []);

  async function install() {
    if (!update) return;
    setInstalling(true);
    try {
      await update.downloadAndInstall();
    } catch (err) {
      await logError("Update install failed", err);
      setInstalling(false);
    }
  }

  function dismiss() {
    setUpdate(null);
  }

  return { update, installing, install, dismiss };
}
