"""fix_currency_null_values

Revision ID: 76e41aedb68b
Revises: b05a5f5fe5a0
Create Date: 2026-03-25 11:45:20.642783

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '76e41aedb68b'
down_revision: Union[str, Sequence[str], None] = 'b05a5f5fe5a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE assets SET currency = 'TRY' WHERE currency IS NULL")


def downgrade() -> None:
    """Downgrade schema."""
    pass
