import type { ErrorCode, Result, SerializedError } from '@kasaio/shared'

export class ApiError extends Error {
  readonly code: ErrorCode
  readonly context?: Record<string, unknown>

  constructor(serialized: SerializedError) {
    super(serialized.message)
    this.name = serialized.name
    this.code = serialized.code
    this.context = serialized.context
  }
}

export function unwrapResult<T>(result: Result<T>): T {
  if (!result.success) throw new ApiError(result.error)
  return result.data
}
