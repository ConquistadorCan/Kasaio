import { AppError } from './AppError.js'
import type { ErrorCode } from './codes.js'

export class ValidationError extends AppError {
  readonly name = 'ValidationError'

  constructor(code: ErrorCode, message: string, context?: Record<string, unknown>) {
    super(code, message, context)
  }
}
