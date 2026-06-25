import { AccountRepository } from '../repositories/AccountRepository.js'
import { AccountService } from './AccountService.js'
import { CategoryRepository } from '../repositories/CategoryRepository.js'
import { CategoryService } from './CategoryService.js'

export interface AppServices {
  account: AccountService
  category: CategoryService
}

export function createServices(): AppServices {
  return {
    account: new AccountService(new AccountRepository()),
    category: new CategoryService(new CategoryRepository()),
  }
}
