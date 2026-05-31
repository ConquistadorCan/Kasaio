from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from enums.investment_transaction_type_enum import InvestmentTransactionType


class InvestmentTransaction(Base):
    __tablename__ = "investment_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), nullable=False)
    type: Mapped[InvestmentTransactionType] = mapped_column(
        "type", Enum(InvestmentTransactionType), nullable=False
    )
    quantity: Mapped[float] = mapped_column(Numeric(18, 8), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(18, 8), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="investment_transactions")
