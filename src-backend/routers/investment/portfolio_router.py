from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from schemas.investment.portfolio_schemas import PortfolioAccountSchema
from services.investment.portfolio_service import PortfolioService

router = APIRouter()


@router.get("", response_model=list[PortfolioAccountSchema])
async def get_portfolio_endpoint(
    account_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await PortfolioService(db).get_portfolio(account_id=account_id)
