from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.transaction_schemas import (
    TransactionCreateSchema,
    TransactionResponseSchema,
    TransactionUpdateSchema,
)
from services.transaction_service import (
    create_transaction,
    delete_transaction,
    get_transaction,
    get_transactions,
    update_transaction,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=list[TransactionResponseSchema])
async def list_transactions(db: AsyncSession = Depends(get_db)):
    return await get_transactions(db)


@router.get("/{transaction_id}", response_model=TransactionResponseSchema)
async def retrieve_transaction(transaction_id: int, db: AsyncSession = Depends(get_db)):
    transaction = await get_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.post("/", response_model=TransactionResponseSchema, status_code=201)
async def add_transaction(data: TransactionCreateSchema, db: AsyncSession = Depends(get_db)):
    return await create_transaction(db, data)


@router.patch("/{transaction_id}", response_model=TransactionResponseSchema)
async def edit_transaction(
    transaction_id: int, data: TransactionUpdateSchema, db: AsyncSession = Depends(get_db)
):
    transaction = await update_transaction(db, transaction_id, data)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.delete("/{transaction_id}", status_code=204)
async def remove_transaction(transaction_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await delete_transaction(db, transaction_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transaction not found")
