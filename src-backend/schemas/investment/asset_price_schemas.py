from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AssetPriceCreateSchema(BaseModel):
    asset_id: int
    price: float
    recorded_at: datetime | None = None


class AssetPriceResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    price: float
    recorded_at: datetime
