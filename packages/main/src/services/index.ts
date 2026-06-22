import { AccountRepository } from '../repositories/AccountRepository.js'
import { AccountService } from './AccountService.js'

export interface AppServices {
  account: AccountService
}

export function createServices(): AppServices {
  return {
    account: new AccountService(new AccountRepository()),
  }
}
