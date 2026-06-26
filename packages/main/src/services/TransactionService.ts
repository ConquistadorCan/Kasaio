import { TransactionRepository } from '../repositories/TransactionRepository.js'
import { AccountRepository } from '../repositories/AccountRepository.js'
import { CategoryRepository } from '../repositories/CategoryRepository.js'
import { NotFoundError, ErrorCode, type Transaction, type NewTransaction } from '@kasaio/shared'

export class TransactionService {
  constructor(
    private repository: TransactionRepository,
    private accountRepository: AccountRepository,
    private categoryRepository: CategoryRepository,
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

  create(data: NewTransaction): Transaction {
    const account = this.accountRepository.findById(data.account_id)
    if (!account) {
      throw new NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, `Account with id ${data.account_id} not found.`, { id: data.account_id })
    }

    if (data.category_id != null) {
      const category = this.categoryRepository.findById(data.category_id)
      if (!category) {
        throw new NotFoundError(ErrorCode.CATEGORY_NOT_FOUND, `Category with id ${data.category_id} not found.`, { id: data.category_id })
      }
    }

    return this.repository.create(data)
  }

  update(id: number, data: Partial<NewTransaction>): Transaction {
    this.getById(id)

    if (data.account_id != null) {
      const account = this.accountRepository.findById(data.account_id)
      if (!account) {
        throw new NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, `Account with id ${data.account_id} not found.`, { id: data.account_id })
      }
    }

    if (data.category_id != null) {
      const category = this.categoryRepository.findById(data.category_id)
      if (!category) {
        throw new NotFoundError(ErrorCode.CATEGORY_NOT_FOUND, `Category with id ${data.category_id} not found.`, { id: data.category_id })
      }
    }

    return this.repository.update(id, data)!
  }

  delete(id: number): void {
    const deleted = this.repository.delete(id)
    if (!deleted) {
      throw new NotFoundError(ErrorCode.TRANSACTION_NOT_FOUND, `Transaction with id ${id} not found.`, { id })
    }
  }
}
