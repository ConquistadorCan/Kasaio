"""wallet_currency_refactor

Revision ID: f3c9d1e2a7b4
Revises: a3f8c1d2e4b5
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f3c9d1e2a7b4"
down_revision: Union[str, Sequence[str], None] = ("a3f8c1d2e4b5", "0ddd40bce0a2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("transactions") as batch_op:
        batch_op.add_column(
            sa.Column("currency", sa.String(3), nullable=False, server_default="TRY")
        )

    op.drop_table("exchange_rates")


def downgrade() -> None:
    with op.batch_alter_table("transactions") as batch_op:
        batch_op.drop_column("currency")

    op.create_table(
        "exchange_rates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("rate", sa.Numeric(10, 4), nullable=False),
        sa.Column("recorded_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
