import logging
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from enums.currency_enum import Currency
from core.exceptions import BusinessRuleError, NotFoundError
from models.exchange_rate import ExchangeRate
from schemas.cash.exchange_rate_schemas import ExchangeRateCreateSchema

logger = logging.getLogger("kasaio")


class ExchangeRateService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_exchange_rates(
        self,
        from_currency: Currency,
        to_currency: Currency,
        limit: int | None = None,
        filter_date: date | None = None,
    ) -> list[ExchangeRate]:
        query = (
            select(ExchangeRate)
            .where(ExchangeRate.from_currency == from_currency)
            .where(ExchangeRate.to_currency == to_currency)
            .order_by(ExchangeRate.recorded_at.desc())
        )
        if filter_date is not None:
            query = query.where(func.date(ExchangeRate.recorded_at) == filter_date)
        if limit is not None:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_exchange_rate(self, data: ExchangeRateCreateSchema) -> ExchangeRate:
        if data.from_currency == data.to_currency:
            raise BusinessRuleError("from_currency and to_currency must be different")
        kwargs: dict = {
            "from_currency": data.from_currency,
            "to_currency": data.to_currency,
            "rate": data.rate,
        }
        if data.recorded_at is not None:
            kwargs["recorded_at"] = data.recorded_at
        exchange_rate = ExchangeRate(**kwargs)
        self.db.add(exchange_rate)
        await self.db.commit()
        await self.db.refresh(exchange_rate)
        logger.info(
            f"ExchangeRate created: id={exchange_rate.id} "
            f"{exchange_rate.from_currency}->{exchange_rate.to_currency} rate={exchange_rate.rate}"
        )
        return exchange_rate

    async def delete_exchange_rate(self, exchange_rate_id: int) -> None:
        exchange_rate = await self.db.get(ExchangeRate, exchange_rate_id)
        if not exchange_rate:
            raise NotFoundError(f"ExchangeRate not found: id={exchange_rate_id}")
        await self.db.delete(exchange_rate)
        await self.db.commit()
        logger.info(f"ExchangeRate deleted: id={exchange_rate_id}")
