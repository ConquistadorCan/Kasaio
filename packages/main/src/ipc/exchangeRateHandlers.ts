import { ipcMain } from 'electron'
import type { ExchangeRateService } from '../services/ExchangeRateService.js'
import type { NewExchangeRate } from '@kasaio/shared'
import { withResult } from './utils.js'

export function registerExchangeRateHandlers(exchangeRateService: ExchangeRateService): void {
  ipcMain.handle('exchangeRates:get-all', () =>
    withResult(() => exchangeRateService.getAll()),
  )

  ipcMain.handle('exchangeRates:get-by-id', (_event, { id }: { id: number }) =>
    withResult(() => exchangeRateService.getById(id)),
  )

  ipcMain.handle('exchangeRates:create', (_event, data: NewExchangeRate) =>
    withResult(() => exchangeRateService.create(data)),
  )

  ipcMain.handle('exchangeRates:delete', (_event, { id }: { id: number }) =>
    withResult(() => exchangeRateService.delete(id)),
  )
}
