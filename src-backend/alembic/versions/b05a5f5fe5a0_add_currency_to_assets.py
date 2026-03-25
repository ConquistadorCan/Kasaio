"""add_currency_to_assets

Revision ID: b05a5f5fe5a0
Revises: 92f125cb67c9
Create Date: 2026-03-25 11:37:38.806052

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b05a5f5fe5a0'
down_revision: Union[str, Sequence[str], None] = '92f125cb67c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('assets', sa.Column('currency', sa.String(3), nullable=True))
    op.execute("UPDATE assets SET currency = 'TRY'")


def downgrade() -> None:
    op.drop_column('assets', 'currency')
