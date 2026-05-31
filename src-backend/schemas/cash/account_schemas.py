from pydantic import BaseModel, ConfigDict

from enums.account_type_enum import AccountType
from enums.currency_enum import Currency


class AccountCreateSchema(BaseModel):
    name: str
    account_type: AccountType
    currency: Currency
    linked_cash_account_id: int | None = None


class AccountResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    account_type: AccountType
    currency: Currency
    is_active: bool
    linked_cash_account_id: int | None


class AccountBalanceResponseSchema(AccountResponseSchema):
    balance: float
