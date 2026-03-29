from database import Base
from datetime import datetime

from sqlalchemy import DateTime, Numeric, String, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from enums.transaction_type_enum import TransactionTypeEnum

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    type: Mapped[TransactionTypeEnum] = mapped_column(Enum(TransactionTypeEnum), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="TRY")
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now())
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    category: Mapped["Category"] = relationship("Category", back_populates="transactions")
    