from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from schemas.investment.asset_price_schemas import AssetPriceCreateSchema, AssetPriceResponseSchema
from services.investment.asset_price_service import AssetPriceService

router = APIRouter()


@router.get("", response_model=list[AssetPriceResponseSchema])
async def list_asset_prices_endpoint(
    asset_id: int = Query(...),
    limit: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await AssetPriceService(db).list_prices(asset_id=asset_id, limit=limit)


@router.post("", response_model=AssetPriceResponseSchema, status_code=201)
async def create_asset_price_endpoint(
    data: AssetPriceCreateSchema, db: AsyncSession = Depends(get_db)
):
    return await AssetPriceService(db).create_price(data)


@router.delete("/{price_id}", status_code=204)
async def delete_asset_price_endpoint(price_id: int, db: AsyncSession = Depends(get_db)):
    await AssetPriceService(db).delete_price(price_id)
