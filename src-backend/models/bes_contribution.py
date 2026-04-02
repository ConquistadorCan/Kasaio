from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class BESContribution(Base):
    __tablename__ = "bes_contributions"

    id: Mapped[int] = mapped_column(primary_key=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("bes_plans.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)

    plan: Mapped["BESPlan"] = relationship("BESPlan", back_populates="contributions")
