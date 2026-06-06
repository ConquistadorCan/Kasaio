"""schema_v2

Revision ID: c1d2e3f4a5b6
Revises: b2c3d4e5f6a7, 76e41aedb68b
Create Date: 2026-05-28 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = ("b2c3d4e5f6a7", "76e41aedb68b")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create accounts table
    op.create_table(
        "accounts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column(
            "account_type",
            sa.Enum("cash", "investment", name="accounttype"),
            nullable=False,
        ),
        sa.Column(
            "currency",
            sa.Enum("TRY", "USD", "EUR", "GBP", name="currency"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("linked_cash_account_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["linked_cash_account_id"], ["accounts.id"], name="fk_accounts_linked_cash"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    conn = op.get_bind()

    # 2. Migrate categories — add type column (nullable first, then recreate NOT NULL)
    with op.batch_alter_table("categories") as batch_op:
        batch_op.add_column(sa.Column("type", sa.Text(), nullable=True))

    conn.execute(sa.text("UPDATE categories SET type = 'expense'"))

    with op.batch_alter_table("categories") as batch_op:
        batch_op.alter_column("type", existing_type=sa.Text(), nullable=False)

    # 4. Migrate transactions
    with op.batch_alter_table("transactions") as batch_op:
        batch_op.add_column(sa.Column("account_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("source_type", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("source_id", sa.Integer(), nullable=True))

    conn.execute(
        sa.text("UPDATE transactions SET type = lower(type)")
    )

    with op.batch_alter_table("transactions") as batch_op:
        batch_op.alter_column("account_id", existing_type=sa.Integer(), nullable=False)
        batch_op.alter_column("amount", existing_type=sa.Numeric(10, 2), type_=sa.Numeric(18, 2))
        batch_op.alter_column("date", existing_type=sa.DateTime(), type_=sa.Date())
        batch_op.alter_column(
            "currency",
            existing_type=sa.String(3),
            type_=sa.Enum("TRY", "USD", "EUR", "GBP", name="currency"),
        )
        batch_op.alter_column(
            "type",
            existing_type=sa.Enum("INCOME", "EXPENSE", name="transactiontypeenum"),
            type_=sa.Enum("income", "expense", "transfer", name="transactiontype"),
        )
        batch_op.alter_column(
            "description",
            existing_type=sa.String(255),
            type_=sa.Text(),
            existing_nullable=True,
        )
        batch_op.create_foreign_key(
            "fk_transactions_account_id", "accounts", ["account_id"], ["id"]
        )

    # 5. Migrate assets — add account_id, drop old columns
    with op.batch_alter_table("assets") as batch_op:
        batch_op.add_column(sa.Column("account_id", sa.Integer(), nullable=True))

    conn.execute(
        sa.text("UPDATE assets SET asset_type = lower(asset_type)")
    )
    # CRYPTOCURRENCY has no direct lowercase match — map to 'crypto'
    conn.execute(
        sa.text("UPDATE assets SET asset_type = 'crypto' WHERE asset_type = 'cryptocurrency'")
    )

    with op.batch_alter_table("assets") as batch_op:
        batch_op.alter_column("account_id", existing_type=sa.Integer(), nullable=False)
        batch_op.drop_column("symbol")
        batch_op.drop_column("currency")
        batch_op.drop_column("maturity_date")
        batch_op.drop_column("coupon_rate")
        batch_op.drop_column("coupon_frequency")
        batch_op.drop_column("first_coupon_date")
        batch_op.drop_column("face_value")
        batch_op.alter_column(
            "name",
            existing_type=sa.String(100),
            type_=sa.Text(),
        )
        batch_op.alter_column(
            "asset_type",
            existing_type=sa.Enum(
                "COMMODITY", "CRYPTOCURRENCY", "TEFAS_FUND", "ETF", "EUROBOND",
                name="assettype",
            ),
            type_=sa.Enum(
                "stock", "etf", "crypto", "commodity", "eurobond", "tefas_fund", "bes",
                name="assettype",
            ),
        )
        batch_op.create_foreign_key(
            "fk_assets_account_id", "accounts", ["account_id"], ["id"]
        )

    # 6. Migrate investment_transactions — rename transaction_type → type, lowercase values,
    #    delete rows that were INCOME (no equivalent in new schema)
    conn.execute(
        sa.text(
            "DELETE FROM investment_transactions WHERE lower(transaction_type) = 'income'"
        )
    )
    conn.execute(
        sa.text("UPDATE investment_transactions SET transaction_type = lower(transaction_type)")
    )

    with op.batch_alter_table("investment_transactions") as batch_op:
        batch_op.alter_column(
            "transaction_type",
            new_column_name="type",
            existing_type=sa.Enum("BUY", "SELL", name="investmenttransactiontype"),
            type_=sa.Enum("buy", "sell", name="investmenttransactiontype"),
        )
        batch_op.alter_column("date", existing_type=sa.DateTime(), type_=sa.Date())

    # 7. Create new tables

    op.create_table(
        "transfers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("from_transaction_id", sa.Integer(), nullable=False),
        sa.Column("to_transaction_id", sa.Integer(), nullable=False),
        sa.Column("exchange_rate", sa.Numeric(18, 8), nullable=True),
        sa.ForeignKeyConstraint(["from_transaction_id"], ["transactions.id"]),
        sa.ForeignKeyConstraint(["to_transaction_id"], ["transactions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "stock_details",
        sa.Column("asset_id", sa.Integer(), nullable=False),
        sa.Column("ticker", sa.Text(), nullable=False),
        sa.Column("exchange", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("asset_id"),
    )

    op.create_table(
        "etf_details",
        sa.Column("asset_id", sa.Integer(), nullable=False),
        sa.Column("ticker", sa.Text(), nullable=False),
        sa.Column("exchange", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("asset_id"),
    )

    op.create_table(
        "crypto_details",
        sa.Column("asset_id", sa.Integer(), nullable=False),
        sa.Column("ticker", sa.Text(), nullable=False),
        sa.Column("network", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("asset_id"),
    )

    op.create_table(
        "commodity_details",
        sa.Column("asset_id", sa.Integer(), nullable=False),
        sa.Column("unit", sa.Text(), nullable=False, server_default="gram"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("asset_id"),
    )

    op.create_table(
        "eurobond_details",
        sa.Column("asset_id", sa.Integer(), nullable=False),
        sa.Column("isin", sa.Text(), nullable=False),
        sa.Column("coupon_rate", sa.Numeric(8, 6), nullable=False),
        sa.Column("maturity_date", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("asset_id"),
    )

    op.create_table(
        "tefas_details",
        sa.Column("asset_id", sa.Integer(), nullable=False),
        sa.Column("fund_code", sa.Text(), nullable=False),
        sa.Column("fund_type", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("asset_id"),
    )

    op.create_table(
        "bes_details",
        sa.Column("asset_id", sa.Integer(), nullable=False),
        sa.Column("company", sa.Text(), nullable=False),
        sa.Column("plan_name", sa.Text(), nullable=False),
        sa.Column("monthly_contribution", sa.Numeric(18, 2), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("asset_id"),
    )

    op.create_table(
        "investment_income",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("asset_id", sa.Integer(), nullable=False),
        sa.Column(
            "income_type",
            sa.Enum("dividend", "coupon", name="investmentincometype"),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # 8. Drop old tables (dependency order)
    op.drop_table("bes_contributions")
    op.drop_table("bes_plans")
    op.drop_table("holdings")


def downgrade() -> None:
    # Recreate dropped tables
    op.create_table(
        "holdings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("asset_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Numeric(18, 8), nullable=False),
        sa.Column("average_cost", sa.Numeric(18, 8), nullable=False),
        sa.Column("realized_pnl", sa.Numeric(18, 8), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("asset_id"),
    )

    op.create_table(
        "bes_plans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("company", sa.String(100), nullable=False),
        sa.Column("current_value", sa.Numeric(18, 2), nullable=True),
        sa.Column("last_updated", sa.DateTime(), nullable=True),
        sa.Column("end_date", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "bes_contributions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.DateTime(), nullable=False),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.ForeignKeyConstraint(["plan_id"], ["bes_plans.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Drop new tables
    op.drop_table("investment_income")
    op.drop_table("bes_details")
    op.drop_table("tefas_details")
    op.drop_table("eurobond_details")
    op.drop_table("commodity_details")
    op.drop_table("crypto_details")
    op.drop_table("etf_details")
    op.drop_table("stock_details")
    op.drop_table("transfers")

    # Restore investment_transactions
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "UPDATE investment_transactions SET type = upper(type)"
        )
    )
    with op.batch_alter_table("investment_transactions") as batch_op:
        batch_op.alter_column(
            "type",
            new_column_name="transaction_type",
            existing_type=sa.Enum("buy", "sell", name="investmenttransactiontype"),
            type_=sa.Enum("BUY", "SELL", "INCOME", name="investmenttransactiontype"),
        )
        batch_op.alter_column("date", existing_type=sa.Date(), type_=sa.DateTime())

    # Restore assets
    with op.batch_alter_table("assets") as batch_op:
        batch_op.add_column(
            sa.Column("symbol", sa.String(20), nullable=True)
        )
        batch_op.add_column(
            sa.Column("currency", sa.Enum("TRY", "USD", name="currency"), nullable=True)
        )
        batch_op.add_column(sa.Column("maturity_date", sa.Date(), nullable=True))
        batch_op.add_column(sa.Column("coupon_rate", sa.Numeric(8, 6), nullable=True))
        batch_op.add_column(sa.Column("coupon_frequency", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("first_coupon_date", sa.Date(), nullable=True))
        batch_op.add_column(sa.Column("face_value", sa.Numeric(18, 8), nullable=True))
        batch_op.drop_column("account_id")
        batch_op.alter_column(
            "asset_type",
            existing_type=sa.Enum(
                "stock", "etf", "crypto", "commodity", "eurobond", "tefas_fund", "bes",
                name="assettype",
            ),
            type_=sa.Enum(
                "COMMODITY", "CRYPTOCURRENCY", "TEFAS_FUND", "ETF", "EUROBOND",
                name="assettype",
            ),
        )

    # Restore transactions
    conn.execute(
        sa.text("UPDATE transactions SET type = upper(type)")
    )
    with op.batch_alter_table("transactions") as batch_op:
        batch_op.drop_column("account_id")
        batch_op.drop_column("source_type")
        batch_op.drop_column("source_id")
        batch_op.alter_column("amount", existing_type=sa.Numeric(18, 2), type_=sa.Numeric(10, 2))
        batch_op.alter_column("date", existing_type=sa.Date(), type_=sa.DateTime())
        batch_op.alter_column(
            "currency",
            existing_type=sa.Enum("TRY", "USD", "EUR", "GBP", name="currency"),
            type_=sa.String(3),
        )
        batch_op.alter_column(
            "type",
            existing_type=sa.Enum("income", "expense", "transfer", name="transactiontype"),
            type_=sa.Enum("INCOME", "EXPENSE", name="transactiontypeenum"),
        )
        batch_op.alter_column(
            "description",
            existing_type=sa.Text(),
            type_=sa.String(255),
            existing_nullable=True,
        )

    # Restore categories
    conn.execute(sa.text("UPDATE categories SET type = upper(type)"))
    with op.batch_alter_table("categories") as batch_op:
        batch_op.drop_column("type")

    # Drop accounts table
    op.drop_table("accounts")
