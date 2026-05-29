from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class StockDetails(Base):
    __tablename__ = "stock_details"

    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), primary_key=True)
    ticker: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    exchange: Mapped[str] = mapped_column(Text, nullable=False)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="stock_details")
