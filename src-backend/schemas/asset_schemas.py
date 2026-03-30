from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict

from enums.asset_type_enum import AssetType
from enums.currency_enum import Currency


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    symbol: str
    name: str
    asset_type: AssetType
    currency: Currency
    maturity_date: Optional[date] = None
    coupon_rate: Optional[float] = None
    coupon_frequency: Optional[int] = None
    first_coupon_date: Optional[date] = None
    face_value: Optional[float] = None


class EurobondDetailsUpdate(BaseModel):
    maturity_date: Optional[date] = None
    coupon_rate: Optional[float] = None
    coupon_frequency: Optional[int] = None
    first_coupon_date: Optional[date] = None
    face_value: Optional[float] = None
