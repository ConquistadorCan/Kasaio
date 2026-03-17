from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.asset_price_schemas import AssetPriceCreate, AssetPriceResponse
from services.asset_price_service import (
    create_asset_price,
    get_asset_prices,
    get_latest_asset_price,
)

router = APIRouter(prefix="/asset-prices", tags=["asset-prices"])


@router.get("/{asset_id}", response_model=list[AssetPriceResponse])
async def list_asset_prices(
    asset_id: int, db: AsyncSession = Depends(get_db)
) -> list[AssetPriceResponse]:
    return await get_asset_prices(db, asset_id)


@router.get("/{asset_id}/latest", response_model=AssetPriceResponse)
async def retrieve_latest_asset_price(
    asset_id: int, db: AsyncSession = Depends(get_db)
) -> AssetPriceResponse:
    price = await get_latest_asset_price(db, asset_id)
    if not price:
        raise HTTPException(status_code=404, detail="No price found for this asset")
    return price


@router.post("/", response_model=AssetPriceResponse, status_code=201)
async def add_asset_price(
    data: AssetPriceCreate, db: AsyncSession = Depends(get_db)
) -> AssetPriceResponse:
    try:
        return await create_asset_price(db, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))