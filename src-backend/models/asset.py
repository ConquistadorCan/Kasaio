from datetime import date
from typing import Optional

from sqlalchemy import String, Date, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from enums.asset_type_enum import AssetType
from enums.currency_enum import Currency


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(primary_key=True)
    symbol: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    asset_type: Mapped[AssetType] = mapped_column(nullable=False)
    currency: Mapped[Currency] = mapped_column(nullable=False)

    # Eurobond-specific (nullable for all other asset types)
    maturity_date: Mapped[Optional[date]] = mapped_column(Date(), nullable=True)
    coupon_rate: Mapped[Optional[float]] = mapped_column(Numeric(8, 6), nullable=True)
    coupon_frequency: Mapped[Optional[int]] = mapped_column(Integer(), nullable=True)
    first_coupon_date: Mapped[Optional[date]] = mapped_column(Date(), nullable=True)
    face_value: Mapped[Optional[float]] = mapped_column(Numeric(18, 8), nullable=True)

    investment_transactions: Mapped[list["InvestmentTransaction"]] = relationship(
        "InvestmentTransaction", back_populates="asset"
    )
    holdings: Mapped[list["Holding"]] = relationship(
        "Holding", back_populates="asset"
    )
    prices: Mapped[list["AssetPrice"]] = relationship(
        "AssetPrice", back_populates="asset"
    )
