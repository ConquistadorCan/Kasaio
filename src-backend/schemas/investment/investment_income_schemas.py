from datetime import date

from pydantic import BaseModel, ConfigDict, field_validator

from enums.investment_income_type_enum import InvestmentIncomeType


class InvestmentIncomeCreateSchema(BaseModel):
    asset_id: int
    income_type: InvestmentIncomeType
    amount: float
    date: date

    @field_validator("amount")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


class InvestmentIncomeResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    income_type: InvestmentIncomeType
    amount: float
    date: date
