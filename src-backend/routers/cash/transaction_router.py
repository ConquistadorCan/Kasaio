from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from enums.transaction_type_enum import TransactionType
from schemas.cash.transaction_schemas import TransactionCreateSchema, TransactionResponseSchema
from services.cash.transaction_service import TransactionService

router = APIRouter()


@router.get("", response_model=list[TransactionResponseSchema])
async def list_transactions_endpoint(
    account_id: int | None = Query(default=None),
    type: TransactionType | None = Query(default=None),
    category_id: int | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await TransactionService(db).list_transactions(
        account_id=account_id,
        type=type,
        category_id=category_id,
        date_from=date_from,
        date_to=date_to,
    )


@router.post("", response_model=TransactionResponseSchema, status_code=201)
async def create_transaction_endpoint(
    data: TransactionCreateSchema, db: AsyncSession = Depends(get_db)
):
    return await TransactionService(db).create_transaction(data)


@router.get("/{transaction_id}", response_model=TransactionResponseSchema)
async def get_transaction_endpoint(transaction_id: int, db: AsyncSession = Depends(get_db)):
    return await TransactionService(db).get_transaction(transaction_id)


@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction_endpoint(
    transaction_id: int, db: AsyncSession = Depends(get_db)
):
    await TransactionService(db).delete_transaction(transaction_id)
