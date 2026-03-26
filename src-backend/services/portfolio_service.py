import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from enums.currency_enum import Currency
from models.asset import Asset
from models.asset_price import AssetPrice
from models.exchange_rate import ExchangeRate
from models.holding import Holding
from schemas.asset_schemas import AssetResponse
from schemas.portfolio_schemas import PortfolioHoldingResponse, PortfolioSummaryResponse

logger = logging.getLogger("kasaio")


async def _get_latest_price(db: AsyncSession, asset_id: int) -> float | None:
    result = await db.execute(
        select(AssetPrice)
        .where(AssetPrice.asset_id == asset_id)
        .order_by(AssetPrice.recorded_at.desc())
        .limit(1)
    )
    asset_price = result.scalar_one_or_none()
    return float(asset_price.price) if asset_price else None


async def _get_latest_exchange_rate(db: AsyncSession, currency: Currency) -> float | None:
    if currency == Currency.TRY:
        return 1.0
    result = await db.execute(
        select(ExchangeRate)
        .where(ExchangeRate.currency == currency)
        .order_by(ExchangeRate.recorded_at.desc())
        .limit(1)
    )
    exchange_rate = result.scalar_one_or_none()
    return float(exchange_rate.rate) if exchange_rate else None


def _to_try(value: float | None, rate: float | None) -> float | None:
    if value is None or rate is None:
        return None
    return value * rate


def _build_holding_response(
    holding: Holding,
    asset: Asset,
    latest_price: float | None,
    exchange_rate: float | None,
) -> PortfolioHoldingResponse:
    quantity = float(holding.quantity)
    average_cost = float(holding.average_cost)
    cost_basis = average_cost * quantity
    cost_basis_try = _to_try(cost_basis, exchange_rate)

    current_price_try = _to_try(latest_price, exchange_rate)

    current_value = latest_price * quantity if latest_price is not None else None
    current_value_try = _to_try(current_value, exchange_rate)

    if current_value is not None:
        pnl = current_value - cost_basis
        pnl_try = _to_try(pnl, exchange_rate)
        pnl_pct = (pnl / cost_basis) * 100 if cost_basis != 0 else None
    else:
        pnl = None
        pnl_try = None
        pnl_pct = None

    return PortfolioHoldingResponse(
        asset=AssetResponse.model_validate(asset),
        quantity=quantity,
        average_cost=average_cost,
        cost_basis=cost_basis,
        cost_basis_try=cost_basis_try,
        current_price=latest_price,
        current_price_try=current_price_try,
        current_value=current_value,
        current_value_try=current_value_try,
        pnl=pnl,
        pnl_try=pnl_try,
        pnl_pct=pnl_pct,
    )


async def get_portfolio_summary(db: AsyncSession) -> PortfolioSummaryResponse:
    result = await db.execute(select(Holding))
    holdings = result.scalars().all()

    holding_responses = []

    for holding in holdings:
        asset = await db.get(Asset, holding.asset_id)
        latest_price = await _get_latest_price(db, holding.asset_id)
        exchange_rate = await _get_latest_exchange_rate(db, asset.currency)
        holding_responses.append(
            _build_holding_response(holding, asset, latest_price, exchange_rate)
        )

    logger.info(f"Portfolio summary built: {len(holding_responses)} holdings")

    total_cost_try = sum(
        h.cost_basis_try for h in holding_responses if h.cost_basis_try is not None
    ) or None

    total_current_value_try = (
        sum(h.current_value_try for h in holding_responses if h.current_value_try is not None)
        or None
    )

    if total_current_value_try is not None and total_cost_try is not None:
        total_pnl_try = total_current_value_try - total_cost_try
        total_pnl_pct = (total_pnl_try / total_cost_try) * 100 if total_cost_try != 0 else None
    else:
        total_pnl_try = None
        total_pnl_pct = None

    return PortfolioSummaryResponse(
        holdings=holding_responses,
        total_cost_try=total_cost_try,
        total_current_value_try=total_current_value_try,
        total_pnl_try=total_pnl_try,
        total_pnl_pct=total_pnl_pct,
    )