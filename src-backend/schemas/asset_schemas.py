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