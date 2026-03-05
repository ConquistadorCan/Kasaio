
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models.transaction import TransactionTypeEnum


class TransactionCreateSchema(BaseModel):
    amount: float
    type: TransactionTypeEnum
    description: str | None = None
    date: datetime
    category_id: int | None = None


class TransactionUpdateSchema(BaseModel):
    amount: float | None = None
    type: TransactionTypeEnum | None = None
    description: str | None = None
    date: datetime | None = None
    category_id: int | None = None


class TransactionResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: float
    type: TransactionTypeEnum
    description: str | None
    date: datetime
    category_id: int | None