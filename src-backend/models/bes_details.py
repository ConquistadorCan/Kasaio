from sqlalchemy import ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class BesDetails(Base):
    __tablename__ = "bes_details"

    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), primary_key=True)
    company: Mapped[str] = mapped_column(Text, nullable=False)
    plan_name: Mapped[str] = mapped_column(Text, nullable=False)
    monthly_contribution: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="bes_details") # type: ignore
