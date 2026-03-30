"""Update Doppelganger and Copycat wake_order from 0 to 1

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-03-28 00:00:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE roles SET wake_order = 1 "
        "WHERE name IN ('Doppelganger', 'Copycat') AND wake_order = 0"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE roles SET wake_order = 0 "
        "WHERE name IN ('Doppelganger', 'Copycat') AND wake_order = 1"
    )
