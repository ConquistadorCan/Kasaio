import { AppError } from './AppError.js'
import type { ErrorCode } from './codes.js'

export class BusinessRuleError extends AppError {
  readonly name = 'BusinessRuleError'

  constructor(code: ErrorCode, message: string, context?: Record<string, unknown>) {
    super(code, message, context)
  }
}
