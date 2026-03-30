import asyncio
import logging

from sqlalchemy import select

from database import AsyncSessionLocal
from enums.asset_type_enum import AssetType
from enums.currency_enum import Currency
from models.asset import Asset

logger = logging.getLogger("kasaio")


ASSETS = [
    Asset(symbol="XAUTRYG", name="Gram Altın", asset_type=AssetType.COMMODITY, currency=Currency.TRY),
    Asset(symbol="XAGTRYG", name="Gram Gümüş", asset_type=AssetType.COMMODITY, currency=Currency.TRY),
    Asset(symbol="BTCTRY", name="Bitcoin", asset_type=AssetType.CRYPTOCURRENCY, currency=Currency.TRY),
    Asset(symbol="TIV", name="TIV Fonu", asset_type=AssetType.TEFAS_FUND, currency=Currency.TRY),
    Asset(symbol="MAC", name="MAC Fonu", asset_type=AssetType.TEFAS_FUND, currency=Currency.TRY),
    Asset(symbol="VOO", name="Vanguard S&P 500 ETF", asset_type=AssetType.ETF, currency=Currency.USD),
    Asset(symbol="US900123AY60", name="Türkiye Devlet Tahvili", asset_type=AssetType.EUROBOND, currency=Currency.USD),
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        for asset in ASSETS:
            existing = await db.execute(select(Asset).where(Asset.symbol == asset.symbol))
            if existing.scalar_one_or_none() is None:
                db.add(asset)
                logger.info(f"Seed: added asset {asset.symbol} ({asset.name})")
            else:
                logger.info(f"Seed: skipped existing asset {asset.symbol}")
        await db.commit()
        logger.info("Seed completed")


if __name__ == "__main__":
    asyncio.run(seed())