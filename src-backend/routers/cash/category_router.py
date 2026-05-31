from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from enums.category_type_enum import CategoryType
from schemas.cash.category_schemas import (
    CategoryCreateSchema,
    CategoryResponseSchema,
    CategoryUpdateSchema,
)
from services.cash.category_service import CategoryService

router = APIRouter()


@router.get("", response_model=list[CategoryResponseSchema])
async def list_categories_endpoint(
    type: CategoryType | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await CategoryService(db).list_categories(type=type)


@router.post("", response_model=CategoryResponseSchema, status_code=201)
async def create_category_endpoint(
    data: CategoryCreateSchema, db: AsyncSession = Depends(get_db)
):
    return await CategoryService(db).create_category(data)


@router.put("/{category_id}", response_model=CategoryResponseSchema)
async def update_category_endpoint(
    category_id: int, data: CategoryUpdateSchema, db: AsyncSession = Depends(get_db)
):
    return await CategoryService(db).update_category(category_id, data)


@router.delete("/{category_id}", status_code=204)
async def delete_category_endpoint(category_id: int, db: AsyncSession = Depends(get_db)):
    await CategoryService(db).delete_category(category_id)
