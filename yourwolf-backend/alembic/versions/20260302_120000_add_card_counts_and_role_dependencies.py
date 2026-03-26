"""Add card counts to roles and role_dependencies table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-02 12:00:00.000000+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add card count columns to roles table
    op.add_column(
        "roles",
        sa.Column(
            "default_count",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )
    op.add_column(
        "roles",
        sa.Column(
            "min_count",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )
    op.add_column(
        "roles",
        sa.Column(
            "max_count",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )

    # Create role_dependencies table
    # Note: the dependencytype enum is created automatically by op.create_table
    # via Base.metadata (which imports the RoleDependency model in env.py).
    # Do NOT create it explicitly — that causes a duplicate type error.
    op.create_table(
        "role_dependencies",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("role_id", UUID(as_uuid=True), nullable=False),
        sa.Column("required_role_id", UUID(as_uuid=True), nullable=False),
        sa.Column(
            "dependency_type",
            sa.Enum("REQUIRES", "RECOMMENDS", name="dependencytype"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["roles.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["required_role_id"],
            ["roles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "role_id",
            "required_role_id",
            name="uq_role_dependency_pair",
        ),
    )
    op.create_index(
        op.f("ix_role_dependencies_role_id"),
        "role_dependencies",
        ["role_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_role_dependencies_role_id"),
        table_name="role_dependencies",
    )
    op.drop_table("role_dependencies")

    # Drop the enum type
    sa.Enum(name="dependencytype").drop(op.get_bind(), checkfirst=True)

    op.drop_column("roles", "max_count")
    op.drop_column("roles", "min_count")
    op.drop_column("roles", "default_count")
