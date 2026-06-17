import { Currency } from './enums.js'

export const TransactionType = {
  INCOME:   'income',
  EXPENSE:  'expense',
  TRANSFER: 'transfer',
} as const
export type TransactionType = typeof TransactionType[keyof typeof TransactionType]

export interface Transaction {
  id:             number
  account_id:     number
  category_id:    number | null
  transaction_type: TransactionType
  amount:         number
  currency:       Currency
  transacted_at:  string
  description:    string | null
}

export type NewTransaction = Omit<Transaction, 'id'>
