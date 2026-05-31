from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict

from enums.asset_type_enum import AssetType


class AssetCreateSchema(BaseModel):
    name: str
    asset_type: AssetType
    account_id: int
    details: dict[str, Any]


class AssetListItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    asset_type: AssetType
    account_id: int
    latest_price: float | None


class AssetDetailResponseSchema(BaseModel):
    id: int
    name: str
    asset_type: AssetType
    account_id: int
    details: dict[str, Any]
    quantity: float
    average_cost: float
    latest_price: float | None
    current_value: float | None
    unrealized_pnl: float | None
    unrealized_pnl_percent: float | None
