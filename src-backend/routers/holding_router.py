from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.holding_schemas import HoldingResponse
from services.holding_service import get_holding, get_holdings

router = APIRouter(prefix="/holdings", tags=["holdings"])


@router.get("/", response_model=list[HoldingResponse])
async def list_holdings(db: AsyncSession = Depends(get_db)) -> list[HoldingResponse]:
    return await get_holdings(db)


@router.get("/{asset_id}", response_model=HoldingResponse)
async def retrieve_holding(
    asset_id: int, db: AsyncSession = Depends(get_db)
) -> HoldingResponse:
    holding = await get_holding(db, asset_id)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    return holding