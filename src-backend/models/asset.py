from sqlalchemy import Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from enums.asset_type_enum import AssetType


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    asset_type: Mapped[AssetType] = mapped_column(Enum(AssetType), nullable=False)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=False)

    account: Mapped["Account"] = relationship("Account", back_populates="assets") # type: ignore
    investment_transactions: Mapped[list["InvestmentTransaction"]] = relationship( # type: ignore
        "InvestmentTransaction", back_populates="asset"
    )
    investment_income: Mapped[list["InvestmentIncome"]] = relationship( # type: ignore
        "InvestmentIncome", back_populates="asset"
    )
    prices: Mapped[list["AssetPrice"]] = relationship( # type: ignore
        "AssetPrice", back_populates="asset"
    )
    stock_details: Mapped["StockDetails | None"] = relationship( # type: ignore
        "StockDetails", back_populates="asset", uselist=False
    )
    etf_details: Mapped["EtfDetails | None"] = relationship( # type: ignore
        "EtfDetails", back_populates="asset", uselist=False
    )
    crypto_details: Mapped["CryptoDetails | None"] = relationship( # type: ignore
        "CryptoDetails", back_populates="asset", uselist=False
    )
    commodity_details: Mapped["CommodityDetails | None"] = relationship( # type: ignore
        "CommodityDetails", back_populates="asset", uselist=False
    )
    eurobond_details: Mapped["EurobondDetails | None"] = relationship( # type: ignore
        "EurobondDetails", back_populates="asset", uselist=False
    )
    tefas_details: Mapped["TefasDetails | None"] = relationship( # type: ignore
        "TefasDetails", back_populates="asset", uselist=False
    )
    bes_details: Mapped["BesDetails | None"] = relationship( # type: ignore
        "BesDetails", back_populates="asset", uselist=False
    )
