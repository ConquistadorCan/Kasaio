import type { AppServices } from '../services/index.js'
import { registerAccountHandlers } from './accountHandlers.js'
import { registerCategoryHandlers } from './categoryHandlers.js'
import { registerTransactionHandlers } from './transactionHandlers.js'

export function registerAllHandlers(services: AppServices): void {
  registerAccountHandlers(services.account)
  registerCategoryHandlers(services.category)
  registerTransactionHandlers(services.transaction)
}
