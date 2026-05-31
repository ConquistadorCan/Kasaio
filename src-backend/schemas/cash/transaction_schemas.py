from datetime import date

from pydantic import BaseModel, ConfigDict

from enums.currency_enum import Currency
from enums.transaction_type_enum import TransactionType


class TransactionCreateSchema(BaseModel):
    account_id: int
    type: TransactionType
    amount: float
    date: date
    category_id: int | None = None
    description: str | None = None


class TransactionResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account_id: int
    category_id: int | None
    type: TransactionType
    amount: float
    currency: Currency
    date: date
    description: str | None
    source_type: str | None
    source_id: int | None
