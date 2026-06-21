import { z } from 'zod'
import { CurrencyEnum } from '../enums/currency.js'

export const AccountTypeEnum = z.enum(['cash', 'investment'])
export type AccountType = z.infer<typeof AccountTypeEnum>

export const AccountSchema = z.object({
  id:           z.number(),
  name:         z.string(),
  account_type: AccountTypeEnum,
  currency:     CurrencyEnum,
})
export type Account = z.infer<typeof AccountSchema>

export const NewAccountSchema = AccountSchema.omit({ id: true })
export type NewAccount = z.infer<typeof NewAccountSchema>
