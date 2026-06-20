import { Currency } from '../enums/currency.js'

export const AccountType = {
  CASH:       'cash',
  INVESTMENT: 'investment',
} as const
export type AccountType = typeof AccountType[keyof typeof AccountType]

export interface Account {
  id:           number
  name:         string
  account_type: AccountType
  currency:     Currency
}
