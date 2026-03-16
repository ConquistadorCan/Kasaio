import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.holding import Holding

logger = logging.getLogger("kasaio")


async def get_holdings(db: AsyncSession) -> list[Holding]:
    result = await db.execute(select(Holding))
    holdings = result.scalars().all()
    logger.info(f"Fetched {len(holdings)} holdings")
    return holdings


async def get_holding(db: AsyncSession, asset_id: int) -> Holding | None:
    result = await db.execute(select(Holding).where(Holding.asset_id == asset_id))
    holding = result.scalar_one_or_none()
    if not holding:
        logger.info(f"Holding not found: asset_id={asset_id}")
    return holding