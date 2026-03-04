from sqlalchemy.ext.asyncio import AsyncSession

from schemas.category_schemas import CategoryCreateSchema
from models.category import Category

async def create_category(db: AsyncSession, data: CategoryCreateSchema) -> Category:
    category = Category(**data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category