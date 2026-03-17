from pydantic import BaseModel, ConfigDict

from enums.asset_type_enum import AssetType


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    symbol: str
    name: str
    asset_type: AssetType