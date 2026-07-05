import { AccountRepository } from '../repositories/AccountRepository.js'
import { TransactionRepository } from '../repositories/TransactionRepository.js'
import { TransferRepository } from '../repositories/TransferRepository.js'
import { getDb } from '../db/connection.js'
import {
  NotFoundError,
  BusinessRuleError,
  ErrorCode,
  type Transfer,
  type TransferRequest,
  type Transaction,
  type NewTransaction,
} from '@kasaio/shared'
import { Money } from '../domain/Money.js'
import { ExchangeRate } from '../domain/ExchangeRate.js'

// A transfer is returned with its two transactions so the IPC layer can
// format them without a second lookup.
export interface TransferWithTransactions {
  transfer: Transfer
  fromTransaction: Transaction
  toTransaction: Transaction
}

export class TransferService {
  constructor(
    private repository: TransferRepository,
    private accountRepository: AccountRepository,
    private transactionRepository: TransactionRepository,
  ) {}

  getById(id: number): TransferWithTransactions {
    const transfer = this.repository.findById(id)

    if (!transfer) {
      throw new NotFoundError(ErrorCode.TRANSFER_NOT_FOUND, `Transfer with id ${id} not found.`, { id })
    }

    return {
      transfer,
      fromTransaction: this.transactionRepository.findById(transfer.from_transaction_id)!,
      toTransaction: this.transactionRepository.findById(transfer.to_transaction_id)!,
    }
  }

  create(data: TransferRequest): TransferWithTransactions {
    if (data.from_account_id === data.to_account_id) {
      throw new BusinessRuleError(ErrorCode.SELF_TRANSFER, 'A transfer must be between two different accounts.', { accountId: data.from_account_id })
    }

    const fromAccount = this.accountRepository.findById(data.from_account_id)
    if (!fromAccount) {
      throw new NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, `Account with id ${data.from_account_id} not found.`, { id: data.from_account_id })
    }
    
    const toAccount = this.accountRepository.findById(data.to_account_id)
    if (!toAccount) {
      throw new NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, `Account with id ${data.to_account_id} not found.`, { id: data.to_account_id })
    }

    const sameCurrency = fromAccount.currency === toAccount.currency
    if (!sameCurrency && data.exchange_rate == null) {
      throw new BusinessRuleError(ErrorCode.MISSING_EXCHANGE_RATE, `An exchange rate is required to transfer between ${fromAccount.currency} and ${toAccount.currency}.`)
    }

    // Money leaves the from-account and arrives in the to-account's currency
    // (converted when the two currencies differ).
    const rate = sameCurrency
      ? null
      : ExchangeRate.fromDecimal(data.exchange_rate!, fromAccount.currency, toAccount.currency)

    const fromMoney = Money.fromDecimal(data.amount, fromAccount.currency)
    const toMoney = rate ? rate.convert(fromMoney) : Money.fromDecimal(data.amount, toAccount.currency)

    const storedRate = rate ? rate.toStored() : null

    const newFromTransaction: NewTransaction = {
      account_id: fromAccount.id,
      category_id: null,
      transaction_type: 'transfer',
      amount: -Math.abs(fromMoney.toMinorUnits()),
      currency: fromAccount.currency,
      transacted_at: data.transacted_at,
      description: data.description ?? null,
    }
    const newToTransaction: NewTransaction = {
      account_id: toAccount.id,
      category_id: null,
      transaction_type: 'transfer',
      amount: Math.abs(toMoney.toMinorUnits()),
      currency: toAccount.currency,
      transacted_at: data.transacted_at,
      description: data.description ?? null,
    }

    const result = getDb().transaction((): TransferWithTransactions => {
      const fromTransaction = this.transactionRepository.create(newFromTransaction)
      const toTransaction = this.transactionRepository.create(newToTransaction)
      const transfer = this.repository.create({
        from_transaction_id: fromTransaction.id,
        to_transaction_id: toTransaction.id,
        exchange_rate: storedRate,
      })
      return { transfer, fromTransaction, toTransaction }
    })()

    return result
  }

  delete(id: number): void {
    const transfer = this.repository.findById(id)
    if (!transfer) {
      throw new NotFoundError(ErrorCode.TRANSFER_NOT_FOUND, `Transfer with id ${id} not found.`, { id })
    }

    getDb().transaction(() => {
      this.repository.delete(id)
      this.transactionRepository.delete(transfer.from_transaction_id)
      this.transactionRepository.delete(transfer.to_transaction_id)
    })()
  }
}
