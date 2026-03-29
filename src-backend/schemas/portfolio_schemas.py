from pydantic import BaseModel

from schemas.asset_schemas import AssetResponse


class PortfolioHoldingResponse(BaseModel):
    asset: AssetResponse
    quantity: float
    average_cost: float
    realized_pnl: float
    cost_basis: float
    current_price: float | None
    current_value: float | None
    pnl: float | None
    pnl_pct: float | None


class PortfolioSummaryResponse(BaseModel):
    holdings: list[PortfolioHoldingResponse]
