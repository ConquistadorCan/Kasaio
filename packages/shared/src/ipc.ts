import type { Result } from './result.js'
import type { Account, NewAccount } from './schemas/account.js'
import type { Category, NewCategory, CategoryType } from './schemas/category.js'

export interface IpcChannels {
  'accounts:get-all': { request: void; response: Result<Account[]> }
  'accounts:get-by-id': { request: { id: number }; response: Result<Account> }
  'accounts:create': { request: NewAccount; response: Result<Account> }
  'accounts:update': { request: { id: number; data: Partial<NewAccount> }; response: Result<Account> }
  'accounts:delete': { request: { id: number }; response: Result<void> }

  'categories:get-all': { request: { type?: CategoryType }; response: Result<Category[]> }
  'categories:get-by-id': { request: { id: number }; response: Result<Category> }
  'categories:create': { request: NewCategory; response: Result<Category> }
  'categories:update': { request: { id: number; data: Partial<NewCategory> }; response: Result<Category> }
  'categories:delete': { request: { id: number }; response: Result<void> }
}
