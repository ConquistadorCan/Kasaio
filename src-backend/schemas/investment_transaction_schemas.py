from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from enums.investment_transaction_type_enum import InvestmentTransactionType


class InvestmentTransactionCreate(BaseModel):
    asset_id: int
    transaction_type: InvestmentTransactionType
    quantity: float
    price: float
    date: datetime

    @field_validator("quantity", "price")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("must be greater than 0")
        return v


class InvestmentTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    transaction_type: InvestmentTransactionType
    quantity: float
    price: float
    date: datetime