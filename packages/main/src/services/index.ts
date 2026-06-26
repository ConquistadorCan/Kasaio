import { AccountRepository } from '../repositories/AccountRepository.js'
import { AccountService } from './AccountService.js'
import { CategoryRepository } from '../repositories/CategoryRepository.js'
import { CategoryService } from './CategoryService.js'
import { TransactionRepository } from '../repositories/TransactionRepository.js'
import { TransactionService } from './TransactionService.js'

export interface AppServices {
  account: AccountService
  category: CategoryService
  transaction: TransactionService
}

export function createServices(): AppServices {
  const accountRepository = new AccountRepository()
  const categoryRepository = new CategoryRepository()

  return {
    account: new AccountService(accountRepository),
    category: new CategoryService(categoryRepository),
    transaction: new TransactionService(new TransactionRepository(), accountRepository, categoryRepository),
  }
}
