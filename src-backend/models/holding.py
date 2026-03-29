from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Holding(Base):
    __tablename__ = "holdings"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), nullable=False, unique=True)
    quantity: Mapped[float] = mapped_column(Numeric(18, 8), nullable=False)
    average_cost: Mapped[float] = mapped_column(Numeric(18, 8), nullable=False)
    realized_pnl: Mapped[float] = mapped_column(Numeric(18, 8), nullable=False, default=0)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="holdings")