from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.investment_transaction_schemas import (
    InvestmentTransactionCreate,
    InvestmentTransactionResponse,
)
from services.investment_transaction_service import (
    create_investment_transaction,
    get_investment_transaction,
    get_investment_transactions,
)

router = APIRouter(prefix="/investment-transactions", tags=["investment-transactions"])


@router.get("/", response_model=list[InvestmentTransactionResponse])
async def list_investment_transactions(
    db: AsyncSession = Depends(get_db),
) -> list[InvestmentTransactionResponse]:
    return await get_investment_transactions(db)


@router.get("/{transaction_id}", response_model=InvestmentTransactionResponse)
async def retrieve_investment_transaction(
    transaction_id: int, db: AsyncSession = Depends(get_db)
) -> InvestmentTransactionResponse:
    transaction = await get_investment_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Investment transaction not found")
    return transaction


@router.post("/", response_model=InvestmentTransactionResponse, status_code=201)
async def add_investment_transaction(
    data: InvestmentTransactionCreate, db: AsyncSession = Depends(get_db)
) -> InvestmentTransactionResponse:
    try:
        return await create_investment_transaction(db, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))