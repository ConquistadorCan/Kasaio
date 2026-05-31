from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from enums.investment_income_type_enum import InvestmentIncomeType
from schemas.investment.investment_income_schemas import (
    InvestmentIncomeCreateSchema,
    InvestmentIncomeResponseSchema,
)
from services.investment.investment_income_service import InvestmentIncomeService

router = APIRouter()


@router.get("", response_model=list[InvestmentIncomeResponseSchema])
async def list_investment_income_endpoint(
    asset_id: int | None = Query(default=None),
    income_type: InvestmentIncomeType | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await InvestmentIncomeService(db).list_income(
        asset_id=asset_id,
        income_type=income_type,
    )


@router.post("", response_model=InvestmentIncomeResponseSchema, status_code=201)
async def create_investment_income_endpoint(
    data: InvestmentIncomeCreateSchema, db: AsyncSession = Depends(get_db)
):
    return await InvestmentIncomeService(db).create_income(data)
