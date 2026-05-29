from datetime import datetime

from sqlalchemy import DateTime, Enum, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from database import Base
from enums.currency_enum import Currency


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id: Mapped[int] = mapped_column(primary_key=True)
    from_currency: Mapped[Currency] = mapped_column(Enum(Currency), nullable=False)
    to_currency: Mapped[Currency] = mapped_column(Enum(Currency), nullable=False)
    rate: Mapped[float] = mapped_column(Numeric(18, 8), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.now
    )
