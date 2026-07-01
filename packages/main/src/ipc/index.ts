import type { AppServices } from '../services/index.js'
import { registerAccountHandlers } from './accountHandlers.js'
import { registerCategoryHandlers } from './categoryHandlers.js'
import { registerTransactionHandlers } from './transactionHandlers.js'
import { registerTransferHandlers } from './transferHandlers.js'
import { registerExchangeRateHandlers } from './exchangeRateHandlers.js'

export function registerAllHandlers(services: AppServices): void {
  registerAccountHandlers(services.account)
  registerCategoryHandlers(services.category)
  registerTransactionHandlers(services.transaction)
  registerTransferHandlers(services.transfer)
  registerExchangeRateHandlers(services.exchangeRate)
}
