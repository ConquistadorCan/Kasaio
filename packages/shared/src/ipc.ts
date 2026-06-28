import type { Result } from './result.js'
import type { Account, NewAccount } from './schemas/account.js'
import type { Category, NewCategory, CategoryType } from './schemas/category.js'
import type { TransactionRequest, TransactionResponse } from './schemas/transaction.js'
import type { TransferRequest, TransferResponse } from './schemas/transfer.js'

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

  'transactions:get-all': { request: { accountId?: number; categoryId?: number; from?: string; to?: string } | void; response: Result<TransactionResponse[]> }
  'transactions:get-by-id': { request: { id: number }; response: Result<TransactionResponse> }
  'transactions:create': { request: TransactionRequest; response: Result<TransactionResponse> }
  'transactions:update': { request: { id: number; data: Partial<TransactionRequest> }; response: Result<TransactionResponse> }
  'transactions:delete': { request: { id: number }; response: Result<void> }

  'transfers:get-by-id': { request: { id: number }; response: Result<TransferResponse> }
  'transfers:create': { request: TransferRequest; response: Result<TransferResponse> }
  'transfers:delete': { request: { id: number }; response: Result<void> }
}
