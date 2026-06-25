import { getDb } from '../db/connection.js'
import { type Category, type NewCategory, type CategoryType } from '@kasaio/shared'

export class CategoryRepository {
  findAll(type?: CategoryType): Category[] {
    if (type) {
      return getDb()
        .prepare('SELECT * FROM categories WHERE category_type = ?')
        .all(type) as Category[]
    }
    return getDb().prepare('SELECT * FROM categories').all() as Category[]
  }

  findById(id: number): Category | undefined {
    return getDb()
      .prepare('SELECT * FROM categories WHERE id = ?')
      .get(id) as Category | undefined
  }

  findByName(name: string): Category | undefined {
    return getDb()
      .prepare('SELECT * FROM categories WHERE name = ?')
      .get(name) as Category | undefined
  }

  create(data: NewCategory): Category {
    const result = getDb()
      .prepare('INSERT INTO categories (name, category_type) VALUES (?, ?)')
      .run(data.name, data.category_type)

    return this.findById(result.lastInsertRowid as number)!
  }

  update(id: number, data: Partial<NewCategory>): Category | undefined {
    const fields = Object.keys(data) as (keyof NewCategory)[]
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => data[f])

    const result = getDb()
      .prepare(`UPDATE categories SET ${setClause} WHERE id = ?`)
      .run(...values, id)

    if (result.changes === 0) return undefined

    return this.findById(id)
  }

  delete(id: number): boolean {
    const result = getDb().prepare('DELETE FROM categories WHERE id = ?').run(id)
    return result.changes > 0
  }
}
