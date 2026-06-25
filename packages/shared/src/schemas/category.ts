import { z } from 'zod'

export const CategoryTypeSchema = z.enum(['income', 'expense'])
export type CategoryType = z.infer<typeof CategoryTypeSchema>

export const CategorySchema = z.object({
  id:            z.number(),
  name:          z.string(),
  category_type: CategoryTypeSchema,
})
export type Category = z.infer<typeof CategorySchema>

export const NewCategorySchema = CategorySchema.omit({ id: true })
export type NewCategory = z.infer<typeof NewCategorySchema>
