import { useState } from 'react'
import { X } from 'lucide-react'
import type { Category } from '@kasaio/shared'
import { useCategories, useDeleteCategory } from '../hooks/useCategories'
import { getErrorMessage } from '../lib/errorMessages'
import CreateCategoryForm from '../components/CreateCategoryForm'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import { Button } from '../components/ui/button'

function CategoryPill({
  category,
  onRequestDelete,
}: {
  category: Category
  onRequestDelete: (category: Category) => void
}) {
  return (
    <div className="group flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-3 pr-1.5 text-sm text-foreground shadow-sm">
      <span>{category.name}</span>
      <button
        type="button"
        aria-label={`Delete ${category.name}`}
        className="rounded-full p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        onClick={() => onRequestDelete(category)}
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

export default function Categories() {
  const { data: categories, isLoading, isError, error } = useCategories()
  const deleteCategory = useDeleteCategory()
  const [formOpen, setFormOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const incomeCategories = (categories ?? []).filter((c) => c.category_type === 'income')
  const expenseCategories = (categories ?? []).filter((c) => c.category_type === 'expense')

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Categories</h1>
        <Button onClick={() => setFormOpen(true)}>Add category</Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {isError && (
        <p className="text-sm text-destructive">Failed to load categories: {getErrorMessage(error)}</p>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="border-b border-border pb-2 text-sm font-medium text-muted-foreground">
              Income &middot; {incomeCategories.length}
            </h2>
            {incomeCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No income categories yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {incomeCategories.map((category) => (
                  <CategoryPill
                    key={category.id}
                    category={category}
                    onRequestDelete={setCategoryToDelete}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="border-b border-border pb-2 text-sm font-medium text-muted-foreground">
              Expense &middot; {expenseCategories.length}
            </h2>
            {expenseCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expense categories yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {expenseCategories.map((category) => (
                  <CategoryPill
                    key={category.id}
                    category={category}
                    onRequestDelete={setCategoryToDelete}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <CreateCategoryForm open={formOpen} onOpenChange={setFormOpen} />

      <DeleteConfirmDialog
        open={categoryToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null)
        }}
        title={`Delete "${categoryToDelete?.name}"?`}
        description="Transactions using this category will keep their history but lose their category link. This can't be undone."
        isPending={deleteCategory.isPending}
        onConfirm={() => {
          if (categoryToDelete) deleteCategory.mutate(categoryToDelete.id)
        }}
      />
    </div>
  )
}
