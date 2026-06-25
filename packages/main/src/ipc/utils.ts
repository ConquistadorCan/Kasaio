import { AppError, ok, error } from '@kasaio/shared'
import type { Result } from '@kasaio/shared'

// Wraps an IPC action in a Result, catching AppErrors and unknown throws into a serializable error shape.
export function withResult<T>(action: () => T): Result<T> {
  try {
    return ok(action())
  } catch (caughtError) {
    if (caughtError instanceof AppError) return error(caughtError.toSerializable())
    return error({ name: 'UnknownError', code: 'UNKNOWN' as never, message: String(caughtError) })
  }
}
