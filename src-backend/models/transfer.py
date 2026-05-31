from typing import Optional

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class Transfer(Base):
    __tablename__ = "transfers"

    id: Mapped[int] = mapped_column(primary_key=True)
    from_transaction_id: Mapped[int] = mapped_column(
        ForeignKey("transactions.id"), nullable=False
    )
    to_transaction_id: Mapped[int] = mapped_column(
        ForeignKey("transactions.id"), nullable=False
    )
    exchange_rate: Mapped[Optional[float]] = mapped_column(Numeric(18, 8), nullable=True)

    from_transaction: Mapped["Transaction"] = relationship(
        "Transaction", foreign_keys=[from_transaction_id]
    )
    to_transaction: Mapped["Transaction"] = relationship(
        "Transaction", foreign_keys=[to_transaction_id]
    )
