import { ipcMain } from 'electron'
import type { TransactionService } from '../services/TransactionService.js'
import { withResult } from './utils.js'

export function registerTransactionHandlers(transactionService: TransactionService): void {
  ipcMain.handle('transactions:get-all', (_event, filters?: Parameters<TransactionService['getAll']>[0]) =>
    withResult(() => transactionService.getAll(filters)),
  )

  ipcMain.handle('transactions:get-by-id', (_event, { id }: { id: number }) =>
    withResult(() => transactionService.getById(id)),
  )

  ipcMain.handle('transactions:create', (_event, data) =>
    withResult(() => transactionService.create(data)),
  )

  ipcMain.handle('transactions:update', (_event, { id, data }: { id: number; data: Parameters<TransactionService['update']>[1] }) =>
    withResult(() => transactionService.update(id, data)),
  )

  ipcMain.handle('transactions:delete', (_event, { id }: { id: number }) =>
    withResult(() => transactionService.delete(id)),
  )
}
