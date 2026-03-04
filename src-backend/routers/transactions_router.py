from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.transaction_schemas import TransactionCreateSchema, TransactionResponseSchema
from services.transaction_service import (
    create_transaction,
    get_transactions,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=list[TransactionResponseSchema])
async def list_transactions(db: AsyncSession = Depends(get_db)):
    return await get_transactions(db)

@router.post("/", response_model=TransactionResponseSchema, status_code=201)
async def add_transaction(data: TransactionCreateSchema, db: AsyncSession = Depends(get_db)):
    return await create_transaction(db, data)
