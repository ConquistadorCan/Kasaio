import { ipcMain } from 'electron'
import type { TransferService, TransferWithTransactions } from '../services/TransferService.js'
import type { Transaction, TransactionResponse, TransferRequest, TransferResponse } from '@kasaio/shared'
import { withResult } from './utils.js'
import { Money } from '../domain/Money.js'

function transactionToResponse(row: Transaction): TransactionResponse {
  const money = Money.fromMinorUnits(row.amount, row.currency)
  return {
    ...row,
    amount: money.toDecimal(),
    amountFormatted: money.format(),
  }
}

function toResponse({ transfer, fromTransaction, toTransaction }: TransferWithTransactions): TransferResponse {
  return {
    ...transfer,
    from_transaction: transactionToResponse(fromTransaction),
    to_transaction: transactionToResponse(toTransaction),
  }
}

export function registerTransferHandlers(transferService: TransferService): void {
  ipcMain.handle('transfers:get-by-id', (_event, { id }: { id: number }) =>
    withResult(() => toResponse(transferService.getById(id))),
  )

  ipcMain.handle('transfers:create', (_event, data: TransferRequest) =>
    withResult(() => toResponse(transferService.create(data))),
  )

  ipcMain.handle('transfers:delete', (_event, { id }: { id: number }) =>
    withResult(() => transferService.delete(id)),
  )
}
