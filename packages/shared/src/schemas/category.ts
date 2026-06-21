import { z } from 'zod'
import { AccountTypeEnum } from './account.js'

export const CategorySchema = z.object({
  id:           z.number(),
  name:         z.string(),
  account_type: AccountTypeEnum,
})
export type Category = z.infer<typeof CategorySchema>

export const NewCategorySchema = CategorySchema.omit({ id: true })
export type NewCategory = z.infer<typeof NewCategorySchema>
