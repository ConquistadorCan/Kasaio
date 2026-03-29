import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.asset import Asset
from models.asset_price import AssetPrice
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


def _build_holding_response(
    holding: Holding,
    asset: Asset,
    latest_price: float | None,
) -> PortfolioHoldingResponse:
    quantity = float(holding.quantity)
    average_cost = float(holding.average_cost)
    realized_pnl = float(holding.realized_pnl)
    cost_basis = average_cost * quantity

    current_value = latest_price * quantity if latest_price is not None else None

    if current_value is not None:
        pnl = (current_value - cost_basis) + realized_pnl
        pnl_pct = (pnl / cost_basis) * 100 if cost_basis != 0 else None
    else:
        pnl = realized_pnl if realized_pnl != 0 else None
        pnl_pct = None

    return PortfolioHoldingResponse(
        asset=AssetResponse.model_validate(asset),
        quantity=quantity,
        average_cost=average_cost,
        realized_pnl=realized_pnl,
        cost_basis=cost_basis,
        current_price=latest_price,
        current_value=current_value,
        pnl=pnl,
        pnl_pct=pnl_pct,
    )


async def get_portfolio_summary(db: AsyncSession) -> PortfolioSummaryResponse:
    result = await db.execute(select(Holding))
    holdings = result.scalars().all()

    holding_responses = []
    for holding in holdings:
        asset = await db.get(Asset, holding.asset_id)
        latest_price = await _get_latest_price(db, holding.asset_id)
        holding_responses.append(_build_holding_response(holding, asset, latest_price))

    logger.info(f"Portfolio summary built: {len(holding_responses)} holdings")

    return PortfolioSummaryResponse(holdings=holding_responses)
