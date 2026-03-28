"""add_income_to_investment_transaction_type

Revision ID: a3f8c1d2e4b5
Revises: b05a5f5fe5a0
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a3f8c1d2e4b5"
down_revision: Union[str, Sequence[str], None] = "b05a5f5fe5a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_ENUM = sa.Enum("BUY", "SELL", "INCOME", name="investmenttransactiontype")
OLD_ENUM = sa.Enum("BUY", "SELL", name="investmenttransactiontype")


def upgrade() -> None:
    with op.batch_alter_table("investment_transactions") as batch_op:
        batch_op.alter_column(
            "transaction_type",
            existing_type=OLD_ENUM,
            type_=NEW_ENUM,
            existing_nullable=False,
        )


def downgrade() -> None:
    with op.batch_alter_table("investment_transactions") as batch_op:
        batch_op.alter_column(
            "transaction_type",
            existing_type=NEW_ENUM,
            type_=OLD_ENUM,
            existing_nullable=False,
        )
