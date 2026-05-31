import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from enums.category_type_enum import CategoryType
from core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from models.category import Category
from models.transaction import Transaction
from schemas.cash.category_schemas import CategoryCreateSchema, CategoryUpdateSchema

logger = logging.getLogger("kasaio")


class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_categories(self, type: CategoryType | None = None) -> list[Category]:
        query = select(Category)
        if type is not None:
            query = query.where(Category.type == type)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_category(self, category_id: int) -> Category:
        category = await self.db.get(Category, category_id)
        if not category:
            raise NotFoundError(f"Category not found: id={category_id}")
        return category

    async def _check_name_unique(self, name: str, exclude_id: int | None = None) -> None:
        query = select(Category).where(Category.name == name)
        if exclude_id is not None:
            query = query.where(Category.id != exclude_id)
        result = await self.db.execute(query)
        if result.scalar_one_or_none() is not None:
            raise BusinessRuleError(f"Category name already exists: '{name}'")

    async def create_category(self, data: CategoryCreateSchema) -> Category:
        await self._check_name_unique(data.name)
        category = Category(**data.model_dump())
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        logger.info(f"Category created: id={category.id} name={category.name}")
        return category

    async def update_category(self, category_id: int, data: CategoryUpdateSchema) -> Category:
        category = await self.get_category(category_id)
        if data.name is not None:
            await self._check_name_unique(data.name, exclude_id=category_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(category, key, value)
        await self.db.commit()
        await self.db.refresh(category)
        logger.info(f"Category updated: id={category.id} name={category.name}")
        return category

    async def delete_category(self, category_id: int) -> None:
        category = await self.get_category(category_id)
        result = await self.db.execute(
            select(Transaction).where(Transaction.category_id == category_id).limit(1)
        )
        if result.scalar_one_or_none() is not None:
            raise ConflictError(
                f"Category id={category_id} is referenced by transactions and cannot be deleted"
            )
        await self.db.delete(category)
        await self.db.commit()
        logger.info(f"Category deleted: id={category_id}")
