"""add_exchange_rates_table

Revision ID: 0ddd40bce0a2
Revises: 76e41aedb68b
Create Date: 2026-03-25 11:56:49.825077

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0ddd40bce0a2'
down_revision: Union[str, Sequence[str], None] = '76e41aedb68b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('investment_transactions', 'note')
    op.create_table(
        'exchange_rates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(), nullable=False),
        sa.Column('rate', sa.Numeric(18, 8), nullable=False),
        sa.Column('recorded_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.add_column('investment_transactions', sa.Column('note', sa.TEXT(), nullable=True))
    op.drop_table('exchange_rates')
