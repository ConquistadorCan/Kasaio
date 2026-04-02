from datetime import datetime

from sqlalchemy import DateTime, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class BESPlan(Base):
    __tablename__ = "bes_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    company: Mapped[str] = mapped_column(String(100), nullable=False)
    current_value: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    last_updated: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    contributions: Mapped[list["BESContribution"]] = relationship(
        "BESContribution", back_populates="plan", cascade="all, delete-orphan"
    )
