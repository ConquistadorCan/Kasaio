from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from enums.currency_enum import Currency
from schemas.cash.exchange_rate_schemas import (
    ExchangeRateCreateSchema,
    ExchangeRateResponseSchema,
)
from services.cash.exchange_rate_service import ExchangeRateService

router = APIRouter()


@router.get("", response_model=list[ExchangeRateResponseSchema])
async def list_exchange_rates_endpoint(
    from_currency: Currency = Query(..., alias="from"),
    to_currency: Currency = Query(..., alias="to"),
    limit: int | None = Query(default=None),
    date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await ExchangeRateService(db).list_exchange_rates(
        from_currency=from_currency,
        to_currency=to_currency,
        limit=limit,
        filter_date=date,
    )


@router.post("", response_model=ExchangeRateResponseSchema, status_code=201)
async def create_exchange_rate_endpoint(
    data: ExchangeRateCreateSchema, db: AsyncSession = Depends(get_db)
):
    return await ExchangeRateService(db).create_exchange_rate(data)


@router.delete("/{exchange_rate_id}", status_code=204)
async def delete_exchange_rate_endpoint(
    exchange_rate_id: int, db: AsyncSession = Depends(get_db)
):
    await ExchangeRateService(db).delete_exchange_rate(exchange_rate_id)
