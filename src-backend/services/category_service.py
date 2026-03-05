from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.category import Category
from schemas.category_schemas import CategoryCreateSchema, CategoryUpdateSchema


async def create_category(db: AsyncSession, data: CategoryCreateSchema) -> Category:
    category = Category(**data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def update_category(db: AsyncSession, category_id: int, data: CategoryUpdateSchema) -> Category | None:
    category = await db.get(Category, category_id)
    if not category:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
    await db.commit()
    await db.refresh(category)
    return category


async def get_categories(db: AsyncSession) -> list[Category]:
    result = await db.execute(select(Category))
    return result.scalars().all()


async def delete_category(db: AsyncSession, category_id: int) -> bool:
    category = await db.get(Category, category_id)
    if not category:
        return False
    await db.delete(category)
    await db.commit()
    return True