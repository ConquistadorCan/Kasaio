import { ApiError } from './result'

const FALLBACK_MESSAGE = 'Something went wrong.'

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return FALLBACK_MESSAGE
}
