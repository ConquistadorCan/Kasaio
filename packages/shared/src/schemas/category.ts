import { AccountType } from './account.js'

export interface Category {
  id:           number
  name:         string
  account_type: AccountType
}

export type NewCategory = Omit<Category, 'id'>
