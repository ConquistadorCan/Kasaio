import { ipcMain } from 'electron'
import type { TransferService, TransferWithTransactions } from '../services/TransferService.js'
import type { Transaction, TransactionResponse, TransferRequest, TransferResponse } from '@kasaio/shared'
import { withResult } from './utils.js'
import { Money } from '../domain/Money.js'
import { ExchangeRate } from '../domain/ExchangeRate.js'

function transactionToResponse(row: Transaction): TransactionResponse {
  const money = Money.fromMinorUnits(row.amount, row.currency)
  return {
    ...row,
    amount: money.toDecimal(),
    amount_formatted: money.format(),
  }
}

function toResponse({ transfer, fromTransaction, toTransaction }: TransferWithTransactions): TransferResponse {
  const rate = transfer.exchange_rate === null
    ? null
    : ExchangeRate.fromStored(transfer.exchange_rate, fromTransaction.currency, toTransaction.currency)

  return {
    ...transfer,
    exchange_rate: rate?.toDecimal() ?? null,
    exchange_rate_formatted: rate?.format() ?? null,
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
