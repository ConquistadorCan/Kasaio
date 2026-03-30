import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.asset_price import AssetPrice
from models.asset import Asset
from schemas.asset_price_schemas import AssetPriceCreate

logger = logging.getLogger("kasaio")


async def create_asset_price(
    db: AsyncSession, data: AssetPriceCreate
) -> AssetPrice:
    asset = await db.get(Asset, data.asset_id)
    if not asset:
        logger.warning(f"Asset not found for price recording: id={data.asset_id}")
        raise ValueError(f"Asset not found: id={data.asset_id}")

    asset_price = AssetPrice(**data.model_dump())
    db.add(asset_price)
    await db.commit()
    await db.refresh(asset_price)
    logger.info(f"Asset price recorded: asset_id={asset_price.asset_id} price={asset_price.price}")
    return asset_price


async def get_latest_asset_price(
    db: AsyncSession, asset_id: int
) -> AssetPrice | None:
    result = await db.execute(
        select(AssetPrice)
        .where(AssetPrice.asset_id == asset_id)
        .order_by(AssetPrice.recorded_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_asset_prices(
    db: AsyncSession, asset_id: int
) -> list[AssetPrice]:
    result = await db.execute(
        select(AssetPrice)
        .where(AssetPrice.asset_id == asset_id)
        .order_by(AssetPrice.recorded_at.desc())
    )
    return result.scalars().all()