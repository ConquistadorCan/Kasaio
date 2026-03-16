from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from models.transaction import TransactionTypeEnum


class TransactionCreateSchema(BaseModel):
    amount: float
    type: TransactionTypeEnum
    description: str | None = None
    date: datetime
    category_id: int | None = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


class TransactionUpdateSchema(BaseModel):
    amount: float | None = None
    type: TransactionTypeEnum | None = None
    description: str | None = None
    date: datetime | None = None
    category_id: int | None = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("amount must be greater than 0")
        return v

    @model_validator(mode="after")
    def required_fields_not_none(self) -> "TransactionUpdateSchema":
        if self.amount is None and "amount" in self.model_fields_set:
            raise ValueError("amount cannot be null")
        if self.type is None and "type" in self.model_fields_set:
            raise ValueError("type cannot be null")
        if self.date is None and "date" in self.model_fields_set:
            raise ValueError("date cannot be null")
        return self


class TransactionResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: float
    type: TransactionTypeEnum
    description: str | None
    date: datetime
    category_id: int | None