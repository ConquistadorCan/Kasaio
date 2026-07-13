import { useState } from 'react'
import { CategoryTypeSchema, type CategoryType } from '@kasaio/shared'
import { useCreateCategory } from '../hooks/useCategories'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

type CreateCategoryFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: CategoryType
}

export default function CreateCategoryForm({
  open,
  onOpenChange,
  defaultType = 'expense',
}: CreateCategoryFormProps) {
  const createCategory = useCreateCategory()

  const [name, setName] = useState('')
  const [categoryType, setCategoryType] = useState<CategoryType>(defaultType)

  const canSubmit = name.trim().length > 0 && !createCategory.isPending

  function reset() {
    setName('')
    setCategoryType(defaultType)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    await createCategory.mutateAsync({
      name: name.trim(),
      category_type: categoryType,
    })

    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
          <DialogDescription>Add a new income or expense category.</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              placeholder="e.g. Groceries, Salary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select
              value={categoryType}
              onValueChange={(value) => setCategoryType(value as CategoryType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CategoryTypeSchema.options.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'income' ? 'Income' : 'Expense'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {createCategory.isPending ? 'Creating...' : 'Create category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
