import type { AppServices } from '../services/index.js'
import { registerAccountHandlers } from './accountHandlers.js'

export function registerAllHandlers(services: AppServices): void {
  registerAccountHandlers(services.account)
}
