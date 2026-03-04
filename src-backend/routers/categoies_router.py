from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.category_schemas import CategoryCreateSchema, CategoryResponseSchema
from services.category_service import (
    create_category
)

router = APIRouter(prefix="/categories", tags=["categories"])

@router.post("/", response_model=CategoryResponseSchema, status_code=201)
async def add_category(data: CategoryCreateSchema, db: AsyncSession = Depends(get_db)):
    return await create_category(db, data)
