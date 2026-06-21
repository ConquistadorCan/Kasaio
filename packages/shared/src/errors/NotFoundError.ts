import { AppError } from './AppError.js'
import type { ErrorCode } from './codes.js'

export class NotFoundError extends AppError {
  readonly name = 'NotFoundError'

  constructor(code: ErrorCode, message: string, context?: Record<string, unknown>) {
    super(code, message, context)
  }
}
