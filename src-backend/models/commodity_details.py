from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class CommodityDetails(Base):
    __tablename__ = "commodity_details"

    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), primary_key=True)
    unit: Mapped[str] = mapped_column(Text, nullable=False, default="gram")

    asset: Mapped["Asset"] = relationship("Asset", back_populates="commodity_details") # type: ignore
