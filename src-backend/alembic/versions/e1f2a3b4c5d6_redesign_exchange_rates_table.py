"""redesign_exchange_rates_table

Revision ID: e1f2a3b4c5d6
Revises: c1d2e3f4a5b6, 0ddd40bce0a2
Create Date: 2026-05-29 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = ("c1d2e3f4a5b6", "0ddd40bce0a2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # exchange_rates was already dropped by f3c9d1e2a7b4 (wallet_currency_refactor),
    # which is in the ancestry chain via c1d2e3f4a5b6 — just create with new schema.
    op.create_table(
        "exchange_rates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "from_currency",
            sa.Enum("TRY", "USD", "EUR", "GBP", name="currency"),
            nullable=False,
        ),
        sa.Column(
            "to_currency",
            sa.Enum("TRY", "USD", "EUR", "GBP", name="currency"),
            nullable=False,
        ),
        sa.Column("rate", sa.Numeric(18, 8), nullable=False),
        sa.Column("recorded_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    # Restore to state after f3c9d1e2a7b4: no exchange_rates table.
    op.drop_table("exchange_rates")
