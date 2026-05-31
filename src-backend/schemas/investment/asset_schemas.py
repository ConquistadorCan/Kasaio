from datetime import date
from typing import Any, Union

from pydantic import BaseModel, ConfigDict

from enums.asset_type_enum import AssetType


class StockDetailsSchema(BaseModel):
    ticker: str
    exchange: str


class EtfDetailsSchema(BaseModel):
    ticker: str
    exchange: str


class CryptoDetailsSchema(BaseModel):
    ticker: str
    network: str


class CommodityDetailsSchema(BaseModel):
    unit: str = "gram"


class EurobondDetailsSchema(BaseModel):
    isin: str
    coupon_rate: float
    maturity_date: date


class TefasDetailsSchema(BaseModel):
    fund_code: str
    fund_type: str


class BesDetailsSchema(BaseModel):
    company: str
    plan_name: str
    monthly_contribution: float


AssetDetails = Union[
    StockDetailsSchema,
    EtfDetailsSchema,
    CryptoDetailsSchema,
    CommodityDetailsSchema,
    EurobondDetailsSchema,
    TefasDetailsSchema,
    BesDetailsSchema,
]


class AssetCreateSchema(BaseModel):
    name: str
    asset_type: AssetType
    account_id: int
    details: AssetDetails


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
