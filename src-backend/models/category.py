from sqlalchemy import Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from enums.category_type_enum import CategoryType


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    type: Mapped[CategoryType] = mapped_column(Enum(CategoryType), nullable=False)

    transactions: Mapped[list["Transaction"]] = relationship( # type: ignore
        "Transaction", back_populates="category"
    )
