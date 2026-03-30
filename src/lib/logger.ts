import { invoke } from "@tauri-apps/api/core";

export async function logError(message: string, error?: unknown) {
  const detail = error instanceof Error ? error.message : String(error ?? "");
  const body = detail ? `${message}: ${detail}` : message;
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 23);
  await invoke("log_frontend_error", { message: `${timestamp} ${body}` });
}
