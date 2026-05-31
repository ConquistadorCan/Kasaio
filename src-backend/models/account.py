from typing import Optional

from sqlalchemy import Boolean, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from enums.account_type_enum import AccountType
from enums.currency_enum import Currency


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    account_type: Mapped[AccountType] = mapped_column(Enum(AccountType), nullable=False)
    currency: Mapped[Currency] = mapped_column(Enum(Currency), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    linked_cash_account_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("accounts.id"), nullable=True
    )

    linked_cash_account: Mapped[Optional["Account"]] = relationship(
        "Account", remote_side="Account.id", foreign_keys=[linked_cash_account_id]
    )
    transactions: Mapped[list["Transaction"]] = relationship( # type: ignore
        "Transaction", back_populates="account"
    )
    assets: Mapped[list["Asset"]] = relationship( # type: ignore
        "Asset", back_populates="account"
    )
