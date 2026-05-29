from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from enums.investment_income_type_enum import InvestmentIncomeType


class InvestmentIncome(Base):
    __tablename__ = "investment_income"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), nullable=False)
    income_type: Mapped[InvestmentIncomeType] = mapped_column(
        Enum(InvestmentIncomeType), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="investment_income")
