from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.portfolio_schemas import PortfolioSummaryResponse
from services.portfolio_service import get_portfolio_summary

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/summary", response_model=PortfolioSummaryResponse)
async def retrieve_portfolio_summary(
    db: AsyncSession = Depends(get_db),
) -> PortfolioSummaryResponse:
    return await get_portfolio_summary(db)