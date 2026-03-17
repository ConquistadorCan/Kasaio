import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.asset import Asset

logger = logging.getLogger("kasaio")


async def get_assets(db: AsyncSession) -> list[Asset]:
    result = await db.execute(select(Asset))
    assets = result.scalars().all()
    logger.info(f"Fetched {len(assets)} assets")
    return assets


async def get_asset(db: AsyncSession, asset_id: int) -> Asset | None:
    asset = await db.get(Asset, asset_id)
    if not asset:
        logger.info(f"Asset not found: id={asset_id}")
    return asset