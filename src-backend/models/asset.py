from sqlalchemy import String
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

    investment_transactions: Mapped[list["InvestmentTransaction"]] = relationship(
        "InvestmentTransaction", back_populates="asset"
    )
    holdings: Mapped[list["Holding"]] = relationship(
        "Holding", back_populates="asset"
    )
    prices: Mapped[list["AssetPrice"]] = relationship(
        "AssetPrice", back_populates="asset"
    )