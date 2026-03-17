from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.asset_schemas import AssetResponse
from services.asset_service import get_asset, get_assets

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("/", response_model=list[AssetResponse])
async def list_assets(db: AsyncSession = Depends(get_db)) -> list[AssetResponse]:
    return await get_assets(db)


@router.get("/{asset_id}", response_model=AssetResponse)
async def retrieve_asset(asset_id: int, db: AsyncSession = Depends(get_db)) -> AssetResponse:
    asset = await get_asset(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset