from pydantic import BaseModel

from schemas.asset_schemas import AssetResponse


class PortfolioHoldingResponse(BaseModel):
    asset: AssetResponse
    quantity: float
    average_cost: float
    cost_basis: float
    cost_basis_try: float | None
    current_price: float | None
    current_price_try: float | None
    current_value: float | None
    current_value_try: float | None
    pnl: float | None
    pnl_try: float | None
    pnl_pct: float | None


class PortfolioSummaryResponse(BaseModel):
    holdings: list[PortfolioHoldingResponse]
    total_cost_try: float | None
    total_current_value_try: float | None
    total_pnl_try: float | None
    total_pnl_pct: float | None