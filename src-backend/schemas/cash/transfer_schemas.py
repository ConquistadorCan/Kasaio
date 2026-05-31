from datetime import date

from pydantic import BaseModel, ConfigDict, field_validator


class TransferCreateSchema(BaseModel):
    from_account_id: int
    to_account_id: int
    from_amount: float
    to_amount: float
    exchange_rate: float | None = None
    date: date
    description: str | None = None

    @field_validator("from_amount", "to_amount")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


class TransferResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_transaction_id: int
    to_transaction_id: int
    exchange_rate: float | None
