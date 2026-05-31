import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import NotFoundError
from models.asset import Asset
from models.asset_price import AssetPrice
from schemas.investment.asset_price_schemas import AssetPriceCreateSchema

logger = logging.getLogger("kasaio")


class AssetPriceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_prices(self, asset_id: int, limit: int | None = None) -> list[AssetPrice]:
        query = (
            select(AssetPrice)
            .where(AssetPrice.asset_id == asset_id)
            .order_by(AssetPrice.recorded_at.desc())
        )
        if limit is not None:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_price(self, data: AssetPriceCreateSchema) -> AssetPrice:
        asset = await self.db.get(Asset, data.asset_id)
        if not asset:
            raise NotFoundError(f"Asset not found: id={data.asset_id}")

        kwargs: dict = {"asset_id": data.asset_id, "price": data.price}
        if data.recorded_at is not None:
            kwargs["recorded_at"] = data.recorded_at

        price = AssetPrice(**kwargs)
        self.db.add(price)
        await self.db.commit()
        await self.db.refresh(price)
        logger.info(f"AssetPrice created: id={price.id} asset={data.asset_id} price={data.price}")
        return price

    async def delete_price(self, price_id: int) -> None:
        price = await self.db.get(AssetPrice, price_id)
        if not price:
            raise NotFoundError(f"AssetPrice not found: id={price_id}")
        await self.db.delete(price)
        await self.db.commit()
        logger.info(f"AssetPrice deleted: id={price_id}")
