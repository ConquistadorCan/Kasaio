import { AccountRepository } from '../repositories/AccountRepository.js'
import { ConflictError, BusinessRuleError, type Account, type NewAccount } from '@kasaio/shared'
import { NotFoundError, ErrorCode } from '@kasaio/shared'

export class AccountService {
  private repository: AccountRepository

  constructor(repository: AccountRepository) {
    this.repository = repository
  }

  // A linked cash account is only allowed for investment accounts, and it must
  // point to a cash account that exists.
  private validateLink(linkedId: number | null | undefined, accountType: Account['account_type']): void {
    if (linkedId == null) return

    if (accountType !== 'investment') {
      throw new BusinessRuleError(ErrorCode.INVALID_ACCOUNT_LINK, 'linked_cash_account_id is only valid for investment accounts.', { linkedId })
    }

    const linked = this.repository.findById(linkedId)
    if (!linked) {
      throw new NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, `Linked account with id ${linkedId} not found.`, { id: linkedId })
    }
    if (linked.account_type !== 'cash') {
      throw new BusinessRuleError(ErrorCode.INVALID_ACCOUNT_LINK, 'linked_cash_account_id must reference a cash account.', { linkedId })
    }
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

    this.validateLink(data.linked_cash_account_id, data.account_type)

    const newAccount = this.repository.create(data)

    return newAccount
  }

  update(id: number, data: Partial<NewAccount>): Account {
    const existing = this.getById(id)

    if (data.name) {
      const byName = this.repository.findByName(data.name)
      if (byName && byName.id !== id) {
        throw new ConflictError(ErrorCode.DUPLICATE_ACCOUNT_NAME, `Account with name "${data.name}" already exists.`, { name: data.name })
      }
    }

    if (data.linked_cash_account_id !== undefined || data.account_type !== undefined) {
      const effectiveType = data.account_type ?? existing.account_type
      const effectiveLink = data.linked_cash_account_id !== undefined ? data.linked_cash_account_id : existing.linked_cash_account_id
      this.validateLink(effectiveLink, effectiveType)
    }

    const updated = this.repository.update(id, data)

    if (!updated) {
      throw new NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, `Account with id ${id} not found.`, { id })
    }

    return updated
  }

  delete(id: number): void {
    const deleted = this.repository.softDelete(id)

    if (!deleted) {
      throw new NotFoundError(ErrorCode.ACCOUNT_NOT_FOUND, `Account with id ${id} not found.`, { id })
    }
  }
}
