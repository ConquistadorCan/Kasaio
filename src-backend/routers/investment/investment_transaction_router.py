from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from enums.investment_transaction_type_enum import InvestmentTransactionType
from schemas.investment.investment_transaction_schemas import (
    InvestmentTransactionCreateSchema,
    InvestmentTransactionResponseSchema,
)
from services.investment.investment_transaction_service import InvestmentTransactionService

router = APIRouter()


@router.get("", response_model=list[InvestmentTransactionResponseSchema])
async def list_investment_transactions_endpoint(
    asset_id: int | None = Query(default=None),
    type: InvestmentTransactionType | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await InvestmentTransactionService(db).list_transactions(
        asset_id=asset_id,
        type=type,
        date_from=date_from,
        date_to=date_to,
    )


@router.post("", response_model=InvestmentTransactionResponseSchema, status_code=201)
async def create_investment_transaction_endpoint(
    data: InvestmentTransactionCreateSchema, db: AsyncSession = Depends(get_db)
):
    return await InvestmentTransactionService(db).create_transaction(data)
