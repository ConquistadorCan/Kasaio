import { ipcMain } from 'electron'
import type { ExchangeRateService } from '../services/ExchangeRateService.js'
import type { ExchangeRate, ExchangeRateRequest, ExchangeRateResponse } from '@kasaio/shared'
import { withResult } from './utils.js'
import { ExchangeRate as ExchangeRateDomain } from '../domain/ExchangeRate.js'

function toResponse(row: ExchangeRate): ExchangeRateResponse {
  const rate = ExchangeRateDomain.fromStored(row.rate, row.from_currency, row.to_currency)
  return { ...row, rate: rate.toDecimal(), rate_formatted: rate.format() }
}

export function registerExchangeRateHandlers(exchangeRateService: ExchangeRateService): void {
  ipcMain.handle('exchangeRates:get-all', () =>
    withResult(() => exchangeRateService.getAll().map(toResponse)),
  )

  ipcMain.handle('exchangeRates:get-by-id', (_event, { id }: { id: number }) =>
    withResult(() => toResponse(exchangeRateService.getById(id))),
  )

  ipcMain.handle('exchangeRates:create', (_event, data: ExchangeRateRequest) =>
    withResult(() => toResponse(exchangeRateService.create(data))),
  )

  ipcMain.handle('exchangeRates:delete', (_event, { id }: { id: number }) =>
    withResult(() => exchangeRateService.delete(id)),
  )
}
