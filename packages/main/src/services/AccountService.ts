import { AccountRepository } from '../repositories/AccountRepository.js'
import { ConflictError, type Account, type NewAccount } from '@kasaio/shared'
import { NotFoundError, ErrorCode } from '@kasaio/shared'

export class AccountService {
  private repository: AccountRepository

  constructor(repository: AccountRepository) {
    this.repository = repository
  }

  getAll(): Account[] {
    return this.repository.findAll()
  }

  getById(id: number): Account {
    const account = this.repository.findById(id)

    if (!account) {
      throw new NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, `Account with id ${id} not found.`, { id: id})
    }

    return account
  }

  create(data: NewAccount): Account {
    const hasAccount = this.repository.findByName(data.name)

    if (hasAccount) {
      throw new ConflictError(ErrorCode.DUPLICATE_ACCOUNT_NAME, `Account with name "${data.name}" already exists.`, { name: data.name })
    }

    const newAccount = this.repository.create(data)

    return newAccount
  }

  update(id: number, data: Partial<NewAccount>): Account {
    if (data.name) {
      const existing = this.repository.findByName(data.name)
      if (existing && existing.id !== id) {
        throw new ConflictError(ErrorCode.DUPLICATE_ACCOUNT_NAME, `Account with name "${data.name}" already exists.`, { name: data.name })
      }
    }

    const updated = this.repository.update(id, data)

    if (!updated) {
      throw new NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, `Account with id ${id} not found.`, { id })
    }

    return updated
  }

  delete(id: number): void {
    const deleted = this.repository.delete(id)

    if (!deleted) {
      throw new NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, `Account with id ${id} not found.`, { id })
    }
  }
}
