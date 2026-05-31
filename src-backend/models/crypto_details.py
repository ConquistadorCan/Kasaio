from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class CryptoDetails(Base):
    __tablename__ = "crypto_details"

    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), primary_key=True)
    ticker: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    network: Mapped[str] = mapped_column(Text, nullable=False)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="crypto_details") # type: ignore
