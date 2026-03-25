from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from enums.currency_enum import Currency
from schemas.exchange_rate_schemas import ExchangeRateCreate, ExchangeRateResponse
from services.exchange_rate_service import (
    create_exchange_rate,
    get_exchange_rates,
    get_latest_exchange_rate,
)

router = APIRouter(prefix="/exchange-rates", tags=["exchange-rates"])


@router.get("/{currency}/latest", response_model=ExchangeRateResponse)
async def retrieve_latest_exchange_rate(
    currency: Currency, db: AsyncSession = Depends(get_db)
) -> ExchangeRateResponse:
    rate = await get_latest_exchange_rate(db, currency)
    if not rate:
        raise HTTPException(status_code=404, detail="No exchange rate found for this currency")
    return rate


@router.get("/{currency}", response_model=list[ExchangeRateResponse])
async def list_exchange_rates(
    currency: Currency, db: AsyncSession = Depends(get_db)
) -> list[ExchangeRateResponse]:
    return await get_exchange_rates(db, currency)


@router.post("/", response_model=ExchangeRateResponse, status_code=201)
async def add_exchange_rate(
    data: ExchangeRateCreate, db: AsyncSession = Depends(get_db)
) -> ExchangeRateResponse:
    return await create_exchange_rate(db, data)