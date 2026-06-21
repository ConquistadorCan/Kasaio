import { AppError } from './AppError.js'
import type { ErrorCode } from './codes.js'

export class ConflictError extends AppError {
  readonly name = 'ConflictError'

  constructor(code: ErrorCode, message: string, context?: Record<string, unknown>) {
    super(code, message, context)
  }
}
