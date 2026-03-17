from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class AssetPriceCreate(BaseModel):
    asset_id: int
    price: float
    recorded_at: datetime

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("price must be greater than 0")
        return v


class AssetPriceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    price: float
    recorded_at: datetime