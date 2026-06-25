import { CategoryRepository } from '../repositories/CategoryRepository.js'
import { ConflictError, NotFoundError, ErrorCode, type Category, type NewCategory, type CategoryType } from '@kasaio/shared'

export class CategoryService {
  private repository: CategoryRepository

  constructor(repository: CategoryRepository) {
    this.repository = repository
  }

  getAll(type?: CategoryType): Category[] {
    return this.repository.findAll(type)
  }

  getById(id: number): Category {
    const category = this.repository.findById(id)

    if (!category) {
      throw new NotFoundError(ErrorCode.CATEGORY_NOT_FOUND, `Category with id ${id} not found.`, { id })
    }

    return category
  }

  create(data: NewCategory): Category {
    const existing = this.repository.findByName(data.name)

    if (existing) {
      throw new ConflictError(ErrorCode.DUPLICATE_CATEGORY_NAME, `Category with name "${data.name}" already exists.`, { name: data.name })
    }

    return this.repository.create(data)
  }

  update(id: number, data: Partial<NewCategory>): Category {
    if (data.name) {
      const existing = this.repository.findByName(data.name)
      if (existing && existing.id !== id) {
        throw new ConflictError(ErrorCode.DUPLICATE_CATEGORY_NAME, `Category with name "${data.name}" already exists.`, { name: data.name })
      }
    }

    const updated = this.repository.update(id, data)

    if (!updated) {
      throw new NotFoundError(ErrorCode.CATEGORY_NOT_FOUND, `Category with id ${id} not found.`, { id })
    }

    return updated
  }

  delete(id: number): void {
    const deleted = this.repository.delete(id)

    if (!deleted) {
      throw new NotFoundError(ErrorCode.CATEGORY_NOT_FOUND, `Category with id ${id} not found.`, { id })
    }
  }
}
