"""add_realized_pnl_to_holdings

Revision ID: c7a2e9f1b3d5
Revises: f3c9d1e2a7b4
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7a2e9f1b3d5"
down_revision: Union[str, Sequence[str], None] = "f3c9d1e2a7b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("holdings") as batch_op:
        batch_op.add_column(
            sa.Column("realized_pnl", sa.Numeric(18, 8), nullable=False, server_default="0")
        )


def downgrade() -> None:
    with op.batch_alter_table("holdings") as batch_op:
        batch_op.drop_column("realized_pnl")
