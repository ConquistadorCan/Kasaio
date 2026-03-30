import { invoke } from "@tauri-apps/api/core";

function format(level: "INFO" | "ERROR", message: string, error?: unknown): string {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 23);
  const detail = error !== undefined
    ? `: ${error instanceof Error ? error.message : String(error)}`
    : "";
  return `${timestamp} [${level}] frontend: ${message}${detail}`;
}

function write(line: string): void {
  invoke("log_frontend_error", { message: line }).catch(() => console.error(line));
}

export async function logError(message: string, error?: unknown): Promise<void> {
  write(format("ERROR", message, error));
}

export function logInfo(message: string): void {
  write(format("INFO", message));
}
