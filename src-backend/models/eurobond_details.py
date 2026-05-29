from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class EurobondDetails(Base):
    __tablename__ = "eurobond_details"

    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), primary_key=True)
    isin: Mapped[str] = mapped_column(Text, nullable=False)
    coupon_rate: Mapped[float] = mapped_column(Numeric(8, 6), nullable=False)
    maturity_date: Mapped[date] = mapped_column(Date, nullable=False)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="eurobond_details")
