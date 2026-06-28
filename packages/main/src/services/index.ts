import { AccountRepository } from '../repositories/AccountRepository.js'
import { AccountService } from './AccountService.js'
import { CategoryRepository } from '../repositories/CategoryRepository.js'
import { CategoryService } from './CategoryService.js'
import { TransactionRepository } from '../repositories/TransactionRepository.js'
import { TransactionService } from './TransactionService.js'
import { TransferRepository } from '../repositories/TransferRepository.js'
import { TransferService } from './TransferService.js'

export interface AppServices {
  account: AccountService
  category: CategoryService
  transaction: TransactionService
  transfer: TransferService
}

export function createServices(): AppServices {
  const accountRepository = new AccountRepository()
  const categoryRepository = new CategoryRepository()
  const transactionRepository = new TransactionRepository()
  const transferRepository = new TransferRepository()

  return {
    account: new AccountService(accountRepository),
    category: new CategoryService(categoryRepository, transactionRepository),
    transaction: new TransactionService(transactionRepository, accountRepository, categoryRepository, transferRepository),
    transfer: new TransferService(transferRepository, accountRepository, transactionRepository),
  }
}
