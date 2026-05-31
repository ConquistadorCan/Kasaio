from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class TefasDetails(Base):
    __tablename__ = "tefas_details"

    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), primary_key=True)
    fund_code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    fund_type: Mapped[str] = mapped_column(Text, nullable=False)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="tefas_details")
