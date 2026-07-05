import { ipcMain } from 'electron'
import type { TransactionService } from '../services/TransactionService.js'
import type { Transaction, TransactionRequest, TransactionResponse } from '@kasaio/shared'
import { withResult } from './utils.js'
import { Money } from '../domain/Money.js'

function toResponse(row: Transaction): TransactionResponse {
  const money = Money.fromMinorUnits(row.amount, row.currency)
  return {
    ...row,
    amount: money.toDecimal(),
    amount_formatted: money.format(),
  }
}

export function registerTransactionHandlers(transactionService: TransactionService): void {
  ipcMain.handle('transactions:get-all', (_event, filters?: Parameters<TransactionService['getAll']>[0]) =>
    withResult(() => transactionService.getAll(filters).map(toResponse)),
  )

  ipcMain.handle('transactions:get-by-id', (_event, { id }: { id: number }) =>
    withResult(() => toResponse(transactionService.getById(id))),
  )

  ipcMain.handle('transactions:create', (_event, data: TransactionRequest) =>
    withResult(() => toResponse(transactionService.create(data))),
  )

  ipcMain.handle('transactions:update', (_event, { id, data }: { id: number; data: Partial<TransactionRequest> }) =>
    withResult(() => toResponse(transactionService.update(id, data))),
  )

  ipcMain.handle('transactions:delete', (_event, { id }: { id: number }) =>
    withResult(() => transactionService.delete(id)),
  )
}
