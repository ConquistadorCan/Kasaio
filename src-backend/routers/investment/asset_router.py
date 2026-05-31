from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from schemas.investment.asset_schemas import AssetCreateSchema, AssetDetailResponseSchema, AssetListItemSchema
from services.investment.asset_service import AssetService

router = APIRouter()


@router.get("", response_model=list[AssetListItemSchema])
async def list_assets_endpoint(db: AsyncSession = Depends(get_db)):
    return await AssetService(db).list_assets()


@router.post("", response_model=AssetDetailResponseSchema, status_code=201)
async def create_asset_endpoint(data: AssetCreateSchema, db: AsyncSession = Depends(get_db)):
    svc = AssetService(db)
    asset = await svc.create_asset(data)
    return await svc.get_asset(asset.id)


@router.get("/{asset_id}", response_model=AssetDetailResponseSchema)
async def get_asset_endpoint(asset_id: int, db: AsyncSession = Depends(get_db)):
    return await AssetService(db).get_asset(asset_id)


@router.delete("/{asset_id}", status_code=204)
async def delete_asset_endpoint(asset_id: int, db: AsyncSession = Depends(get_db)):
    await AssetService(db).delete_asset(asset_id)
