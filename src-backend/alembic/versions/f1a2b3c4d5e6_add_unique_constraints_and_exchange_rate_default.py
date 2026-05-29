"""add_unique_constraints_and_exchange_rate_default

Revision ID: f1a2b3c4d5e6
Revises: e1f2a3b4c5d6
Create Date: 2026-05-29 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("stock_details") as batch_op:
        batch_op.create_unique_constraint("uq_stock_details_ticker", ["ticker"])

    with op.batch_alter_table("etf_details") as batch_op:
        batch_op.create_unique_constraint("uq_etf_details_ticker", ["ticker"])

    with op.batch_alter_table("crypto_details") as batch_op:
        batch_op.create_unique_constraint("uq_crypto_details_ticker", ["ticker"])

    with op.batch_alter_table("eurobond_details") as batch_op:
        batch_op.create_unique_constraint("uq_eurobond_details_isin", ["isin"])

    with op.batch_alter_table("tefas_details") as batch_op:
        batch_op.create_unique_constraint("uq_tefas_details_fund_code", ["fund_code"])

    op.drop_table("exchange_rates")
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
        sa.Column(
            "recorded_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    with op.batch_alter_table("tefas_details") as batch_op:
        batch_op.drop_constraint("uq_tefas_details_fund_code", type_="unique")

    with op.batch_alter_table("eurobond_details") as batch_op:
        batch_op.drop_constraint("uq_eurobond_details_isin", type_="unique")

    with op.batch_alter_table("crypto_details") as batch_op:
        batch_op.drop_constraint("uq_crypto_details_ticker", type_="unique")

    with op.batch_alter_table("etf_details") as batch_op:
        batch_op.drop_constraint("uq_etf_details_ticker", type_="unique")

    with op.batch_alter_table("stock_details") as batch_op:
        batch_op.drop_constraint("uq_stock_details_ticker", type_="unique")

    op.drop_table("exchange_rates")
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
