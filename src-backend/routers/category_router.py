from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.category_schemas import CategoryCreateSchema, CategoryResponseSchema, CategoryUpdateSchema
from services.category_service import (
    create_category,
    delete_category,
    get_categories,
    update_category,
)

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryResponseSchema])
async def list_categories(db: AsyncSession = Depends(get_db)):
    return await get_categories(db)


@router.post("/", response_model=CategoryResponseSchema, status_code=201)
async def add_category(data: CategoryCreateSchema, db: AsyncSession = Depends(get_db)):
    return await create_category(db, data)


@router.patch("/{category_id}", response_model=CategoryResponseSchema)
async def edit_category(category_id: int, data: CategoryUpdateSchema, db: AsyncSession = Depends(get_db)):
    category = await update_category(db, category_id, data)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.delete("/{category_id}", status_code=204)
async def remove_category(category_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await delete_category(db, category_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Category not found")