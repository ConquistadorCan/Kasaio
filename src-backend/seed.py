import logging

from sqlalchemy import select

from database import AsyncSessionLocal
from enums.asset_type_enum import AssetType
from models.asset import Asset


ASSETS = [
    Asset(symbol="XAUTRYG", name="Gram Altın", asset_type=AssetType.COMMODITY),
    Asset(symbol="XAGTRYG", name="Gram Gümüş", asset_type=AssetType.COMMODITY),
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        for asset in ASSETS:
            existing = await db.execute(select(Asset).where(Asset.symbol == asset.symbol))
            if existing.scalar_one_or_none() is None:
                db.add(asset)
                logging.info(f"Added: {asset.name}")
            else:
                logging.info(f"Skipped (already exists): {asset.name}")
        await db.commit()
        logging.info("Seed completed.")