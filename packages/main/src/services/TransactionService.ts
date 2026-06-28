import { TransactionRepository } from '../repositories/TransactionRepository.js'
import { AccountRepository } from '../repositories/AccountRepository.js'
import { CategoryRepository } from '../repositories/CategoryRepository.js'
import { TransferRepository } from '../repositories/TransferRepository.js'
import { NotFoundError, BusinessRuleError, ConflictError, ErrorCode, TransactionTypeSchema, type Transaction, type NewTransaction, type TransactionRequest } from '@kasaio/shared'
import { Money } from '../domain/Money.js'

export class TransactionService {
  constructor(
    private repository: TransactionRepository,
    private accountRepository: AccountRepository,
    private categoryRepository: CategoryRepository,
    private transferRepository: TransferRepository,
  ) {}

  getAll(filters: { accountId?: number; categoryId?: number; from?: string; to?: string } = {}): Transaction[] {
    if (filters.accountId != null && !this.accountRepository.findById(filters.accountId)) {
      throw new NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, `Account with id ${filters.accountId} not found.`, { id: filters.accountId })
    }
    if (filters.categoryId != null && !this.categoryRepository.findById(filters.categoryId)) {
      throw new NotFoundError(ErrorCode.CATEGORY_NOT_FOUND, `Category with id ${filters.categoryId} not found.`, { id: filters.categoryId })
    }
    return this.repository.findAll(filters)
  }

  getById(id: number): Transaction {
    const transaction = this.repository.findById(id)
    if (!transaction) {
      throw new NotFoundError(ErrorCode.TRANSACTION_NOT_FOUND, `Transaction with id ${id} not found.`, { id })
    }
    return transaction
  }

  create(data: TransactionRequest): Transaction {
    if (data.transaction_type === TransactionTypeSchema.enum.transfer) {
      throw new BusinessRuleError(ErrorCode.INVALID_TRANSACTION_TYPE, 'Transfer transactions must be created through the transfer service.')
    }

    const account = this.accountRepository.findById(data.account_id)
    if (!account) {
      throw new NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, `Account with id ${data.account_id} not found.`, { id: data.account_id })
    }

    if (data.category_id != null) {
      const category = this.categoryRepository.findById(data.category_id)
      if (!category) {
        throw new NotFoundError(ErrorCode.CATEGORY_NOT_FOUND, `Category with id ${data.category_id} not found.`, { id: data.category_id })
      }
      if (category.category_type !== data.transaction_type) {
        throw new BusinessRuleError(ErrorCode.CATEGORY_TYPE_MISMATCH, `Category type '${category.category_type}' does not match transaction type '${data.transaction_type}'.`)
      }
    }

    const newTransaction: NewTransaction = {
      ...data,
      description: data.description ?? null,
      amount: Money.toSignedAmount(Money.fromDecimal(data.amount, data.currency).toMinorUnits(), data.transaction_type),
    }

    return this.repository.create(newTransaction)
  }

  update(id: number, data: Partial<TransactionRequest>): Transaction {
    const existing = this.getById(id)

    if (data.transaction_type === TransactionTypeSchema.enum.transfer || existing.transaction_type === TransactionTypeSchema.enum.transfer) {
      throw new BusinessRuleError(ErrorCode.INVALID_TRANSACTION_TYPE, 'Transfer transactions cannot be updated directly.')
    }

    if (data.account_id != null) {
      const account = this.accountRepository.findById(data.account_id)
      if (!account) {
        throw new NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, `Account with id ${data.account_id} not found.`, { id: data.account_id })
      }
    }

    const effectiveType = data.transaction_type ?? existing.transaction_type

    if (data.category_id != null) {
      const category = this.categoryRepository.findById(data.category_id)
      if (!category) {
        throw new NotFoundError(ErrorCode.CATEGORY_NOT_FOUND, `Category with id ${data.category_id} not found.`, { id: data.category_id })
      }
      if (category.category_type !== effectiveType) {
        throw new BusinessRuleError(ErrorCode.CATEGORY_TYPE_MISMATCH, `Category type '${category.category_type}' does not match transaction type '${effectiveType}'.`)
      }
    }

    const effectiveCurrency = data.currency ?? existing.currency
    const updatedFields: Partial<NewTransaction> = data.amount != null
      ? { ...data, amount: Money.toSignedAmount(Money.fromDecimal(data.amount, effectiveCurrency).toMinorUnits(), effectiveType) }
      : data

    return this.repository.update(id, updatedFields)!
  }

  delete(id: number): void {
    this.getById(id)

    if (this.transferRepository.findByTransactionId(id)) {
      throw new ConflictError(ErrorCode.TRANSACTION_BELONGS_TO_TRANSFER, `Transaction with id ${id} belongs to a transfer and must be deleted through the transfer service.`, { id })
    }

    this.repository.delete(id)
  }
}
