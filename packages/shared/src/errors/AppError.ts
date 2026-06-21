import type { ErrorCode } from './codes.js'

export interface SerializedError {
  name: string
  code: ErrorCode
  message: string
  context?: Record<string, unknown>
}

export abstract class AppError extends Error {
  abstract readonly name: string
  readonly code: ErrorCode
  readonly context?: Record<string, unknown>

  constructor(code: ErrorCode, message: string, context?: Record<string, unknown>) {
    super(message)
    this.code = code
    this.context = context
    Object.setPrototypeOf(this, new.target.prototype)
  }

  toSerializable(): SerializedError {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
    }
  }

  static isAppError(value: unknown): value is AppError {
    return value instanceof AppError
  }

  static fromSerializable(serialized: SerializedError): SerializedError {
    // Returns the plain object so renderer can switch on name/code without needing class instances
    return serialized
  }
}
