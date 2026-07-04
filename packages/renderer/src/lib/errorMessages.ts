import { ErrorCode } from '@kasaio/shared'

const FALLBACK_MESSAGE = 'Something went wrong. Check the logs for details.'

const ERROR_MESSAGES: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.ACCOUNT_NOT_FOUND]: 'That account could not be found.',
  [ErrorCode.CATEGORY_NOT_FOUND]: 'That category could not be found.',
  [ErrorCode.TRANSACTION_NOT_FOUND]: 'That transaction could not be found.',
  [ErrorCode.TRANSFER_NOT_FOUND]: 'That transfer could not be found.',
  [ErrorCode.EXCHANGE_RATE_NOT_FOUND]: 'That exchange rate could not be found.',

  [ErrorCode.VALIDATION_FAILED]: 'Some of the information provided is invalid.',
  [ErrorCode.INVALID_AMOUNT]: 'Please enter a valid amount.',
  [ErrorCode.INVALID_CURRENCY]: 'Please select a valid currency.',
  [ErrorCode.INVALID_DATE]: 'Please enter a valid date.',

  [ErrorCode.INVALID_TRANSACTION_TYPE]: 'That transaction type is not valid.',
  [ErrorCode.CATEGORY_TYPE_MISMATCH]: 'This category cannot be used with this transaction type.',
  [ErrorCode.SAME_CURRENCY_EXCHANGE_RATE]: 'Exchange rates require two different currencies.',
  [ErrorCode.MISSING_EXCHANGE_RATE]: 'An exchange rate is required for this operation.',
  [ErrorCode.INVALID_ACCOUNT_LINK]: 'This account link is not valid.',
  [ErrorCode.INSUFFICIENT_FUNDS]: 'This account does not have sufficient funds.',
  [ErrorCode.SELF_TRANSFER]: 'You cannot transfer between the same account.',
  [ErrorCode.ACCOUNT_INACTIVE]: 'This account is inactive.',

  [ErrorCode.DUPLICATE_ACCOUNT_NAME]: 'An account with this name already exists.',
  [ErrorCode.DUPLICATE_CATEGORY_NAME]: 'A category with this name already exists.',
  [ErrorCode.DUPLICATE_EXCHANGE_RATE]: 'An exchange rate for this pair and date already exists.',
  [ErrorCode.CATEGORY_IN_USE]: 'This category is in use and cannot be removed.',
  [ErrorCode.TRANSACTION_BELONGS_TO_TRANSFER]: 'This transaction is part of a transfer and cannot be edited directly.',
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const message = ERROR_MESSAGES[(error as { code: ErrorCode }).code]
    if (message) return message
  }
  return FALLBACK_MESSAGE
}
