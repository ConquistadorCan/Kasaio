from datetime import datetime

from pydantic import BaseModel, ConfigDict

from enums.currency_enum import Currency


class ExchangeRateCreateSchema(BaseModel):
    from_currency: Currency
    to_currency: Currency
    rate: float
    recorded_at: datetime | None = None


class ExchangeRateResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_currency: Currency
    to_currency: Currency
    rate: float
    recorded_at: datetime
