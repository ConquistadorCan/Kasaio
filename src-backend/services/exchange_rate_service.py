import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.exchange_rate import ExchangeRate
from enums.currency_enum import Currency
from schemas.exchange_rate_schemas import ExchangeRateCreate

logger = logging.getLogger("kasaio")


async def create_exchange_rate(
    db: AsyncSession, data: ExchangeRateCreate
) -> ExchangeRate:
    exchange_rate = ExchangeRate(**data.model_dump())
    db.add(exchange_rate)
    await db.commit()
    await db.refresh(exchange_rate)
    logger.info(f"Exchange rate recorded: currency={exchange_rate.currency} rate={exchange_rate.rate}")
    return exchange_rate


async def get_latest_exchange_rate(
    db: AsyncSession, currency: Currency
) -> ExchangeRate | None:
    result = await db.execute(
        select(ExchangeRate)
        .where(ExchangeRate.currency == currency)
        .order_by(ExchangeRate.recorded_at.desc())
        .limit(1)
    )
    exchange_rate = result.scalar_one_or_none()
    if not exchange_rate:
        logger.info(f"No exchange rate found for currency={currency}")
    return exchange_rate


async def get_exchange_rates(
    db: AsyncSession, currency: Currency
) -> list[ExchangeRate]:
    result = await db.execute(
        select(ExchangeRate)
        .where(ExchangeRate.currency == currency)
        .order_by(ExchangeRate.recorded_at.desc())
    )
    return result.scalars().all()