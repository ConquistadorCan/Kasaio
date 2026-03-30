"""add_eurobond_fields_to_assets

Revision ID: d4e7f2a1b8c3
Revises: c7a2e9f1b3d5
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e7f2a1b8c3"
down_revision: Union[str, Sequence[str], None] = "c7a2e9f1b3d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("assets") as batch_op:
        batch_op.add_column(sa.Column("maturity_date", sa.Date(), nullable=True))
        batch_op.add_column(sa.Column("coupon_rate", sa.Numeric(8, 6), nullable=True))
        batch_op.add_column(sa.Column("coupon_frequency", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("first_coupon_date", sa.Date(), nullable=True))
        batch_op.add_column(sa.Column("face_value", sa.Numeric(18, 8), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("assets") as batch_op:
        batch_op.drop_column("face_value")
        batch_op.drop_column("first_coupon_date")
        batch_op.drop_column("coupon_frequency")
        batch_op.drop_column("coupon_rate")
        batch_op.drop_column("maturity_date")
