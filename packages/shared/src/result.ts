import type { SerializedError } from './errors/AppError.js'

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: SerializedError }

export function ok<T>(data: T): Result<T> {
  return { success: true, data }
}

export function error(error: SerializedError): Result<never> {
  return { success: false, error }
}
