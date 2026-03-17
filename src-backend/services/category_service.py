import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.category import Category
from schemas.category_schemas import CategoryCreateSchema, CategoryUpdateSchema

logger = logging.getLogger("kasaio")


async def create_category(db: AsyncSession, data: CategoryCreateSchema) -> Category:
    category = Category(**data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    logger.info(f"Category created: id={category.id} name={category.name}")
    return category


async def update_category(
    db: AsyncSession, category_id: int, data: CategoryUpdateSchema
) -> Category | None:
    category = await db.get(Category, category_id)
    if not category:
        logger.info(f"Category not found for update: id={category_id}")
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
    await db.commit()
    await db.refresh(category)
    logger.info(f"Category updated: id={category.id} name={category.name}")
    return category


async def get_categories(db: AsyncSession) -> list[Category]:
    result = await db.execute(select(Category))
    categories = result.scalars().all()
    logger.info(f"Fetched {len(categories)} categories")
    return categories


async def delete_category(db: AsyncSession, category_id: int) -> bool:
    category = await db.get(Category, category_id)
    if not category:
        logger.info(f"Category not found for delete: id={category_id}")
        return False
    await db.delete(category)
    await db.commit()
    logger.info(f"Category deleted: id={category_id}")
    return True