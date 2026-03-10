import { invoke } from "@tauri-apps/api/core";

export async function logError(message: string, error?: unknown) {
  const detail = error instanceof Error ? error.message : String(error ?? "");
  const full = detail ? `${message}: ${detail}` : message;
  await invoke("log_frontend_error", { message: full });
}
