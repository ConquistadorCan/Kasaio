from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from enums.currency_enum import Currency


class ExchangeRateCreate(BaseModel):
    currency: Currency
    rate: float
    recorded_at: datetime

    @field_validator("rate")
    @classmethod
    def rate_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("rate must be greater than 0")
        return v


class ExchangeRateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    currency: Currency
    rate: float
    recorded_at: datetime