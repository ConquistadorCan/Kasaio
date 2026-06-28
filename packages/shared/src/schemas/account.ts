import { z } from 'zod'
import { CurrencyEnum } from '../enums/currency.js'

export const AccountTypeEnum = z.enum(['cash', 'investment'])
export type AccountType = z.infer<typeof AccountTypeEnum>

export const AccountSchema = z.object({
  id:                     z.number(),
  name:                   z.string(),
  account_type:           AccountTypeEnum,
  currency:               CurrencyEnum,
  linked_cash_account_id: z.number().nullable(),
  is_active:              z.boolean(),
})
export type Account = z.infer<typeof AccountSchema>

// is_active is set automatically (true at first, false on delete),
// so the client never sends it.
export const NewAccountSchema = AccountSchema
  .omit({ id: true, is_active: true })
  .extend({ linked_cash_account_id: z.number().nullable().optional() })
export type NewAccount = z.infer<typeof NewAccountSchema>
