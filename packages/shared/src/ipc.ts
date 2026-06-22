import type { Result } from './result.js'
import type { Account, NewAccount } from './schemas/account.js'

export interface IpcChannels {
  'accounts:get-all': { request: void; response: Result<Account[]> }
  'accounts:get-by-id': { request: { id: number }; response: Result<Account> }
  'accounts:create': { request: NewAccount; response: Result<Account> }
  'accounts:update': { request: { id: number; data: Partial<NewAccount> }; response: Result<Account> }
  'accounts:delete': { request: { id: number }; response: Result<void> }
}
