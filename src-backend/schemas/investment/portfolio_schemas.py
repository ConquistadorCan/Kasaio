from pydantic import BaseModel

from enums.asset_type_enum import AssetType
from enums.currency_enum import Currency


class PortfolioAssetSchema(BaseModel):
    id: int
    name: str
    asset_type: AssetType
    quantity: float
    average_cost: float
    latest_price: float | None
    current_value: float | None
    unrealized_pnl: float | None
    unrealized_pnl_percent: float | None


class PortfolioAccountSchema(BaseModel):
    account_id: int
    account_name: str
    currency: Currency
    assets: list[PortfolioAssetSchema]
    total_cost: float
    total_value: float | None
    total_pnl: float | None
    total_pnl_percent: float | None
