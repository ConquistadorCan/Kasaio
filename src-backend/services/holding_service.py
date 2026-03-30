import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.asset_price import AssetPrice
from models.holding import Holding
from schemas.holding_schemas import HoldingResponse

logger = logging.getLogger("kasaio")


def _calculate_holding_response(holding: Holding, latest_price: float | None) -> HoldingResponse:
    quantity = float(holding.quantity)
    average_cost = float(holding.average_cost)
    realized_pnl = float(holding.realized_pnl)
    cost_basis = average_cost * quantity

    if latest_price is not None:
        current_value = latest_price * quantity
        pnl = (current_value - cost_basis) + realized_pnl
        pnl_pct = (pnl / cost_basis) * 100 if cost_basis != 0 else None
    else:
        current_value = None
        pnl = realized_pnl if realized_pnl != 0 else None
        pnl_pct = None

    return HoldingResponse(
        id=holding.id,
        asset_id=holding.asset_id,
        quantity=quantity,
        average_cost=average_cost,
        realized_pnl=realized_pnl,
        cost_basis=cost_basis,
        current_value=current_value,
        pnl=pnl,
        pnl_pct=pnl_pct,
    )


async def _get_latest_price(db: AsyncSession, asset_id: int) -> float | None:
    result = await db.execute(
        select(AssetPrice)
        .where(AssetPrice.asset_id == asset_id)
        .order_by(AssetPrice.recorded_at.desc())
        .limit(1)
    )
    asset_price = result.scalar_one_or_none()
    return float(asset_price.price) if asset_price else None


async def get_holdings(db: AsyncSession) -> list[HoldingResponse]:
    result = await db.execute(select(Holding))
    holdings = result.scalars().all()
    responses = []
    for holding in holdings:
        latest_price = await _get_latest_price(db, holding.asset_id)
        responses.append(_calculate_holding_response(holding, latest_price))
    return responses


async def get_holding(db: AsyncSession, asset_id: int) -> HoldingResponse | None:
    result = await db.execute(select(Holding).where(Holding.asset_id == asset_id))
    holding = result.scalar_one_or_none()
    if not holding:
        logger.warning(f"Holding not found: asset_id={asset_id}")
        return None
    latest_price = await _get_latest_price(db, asset_id)
    return _calculate_holding_response(holding, latest_price)