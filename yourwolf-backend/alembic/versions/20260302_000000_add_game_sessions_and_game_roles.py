"""Add game_sessions and game_roles tables

Revision ID: a1b2c3d4e5f6
Revises: 0e405697b042
Create Date: 2026-03-02 00:00:00.000000+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "0e405697b042"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "game_sessions",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("facilitator_id", UUID(as_uuid=True), nullable=True),
        sa.Column("player_count", sa.Integer(), nullable=False),
        sa.Column("center_card_count", sa.Integer(), nullable=False),
        sa.Column("discussion_timer_seconds", sa.Integer(), nullable=False),
        sa.Column(
            "phase",
            sa.Enum(
                "SETUP",
                "NIGHT",
                "DISCUSSION",
                "VOTING",
                "RESOLUTION",
                "COMPLETE",
                name="gamephase",
            ),
            nullable=False,
        ),
        sa.Column("current_wake_order", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["facilitator_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_game_sessions_facilitator_id"),
        "game_sessions",
        ["facilitator_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_game_sessions_phase"),
        "game_sessions",
        ["phase"],
        unique=False,
    )

    op.create_table(
        "game_roles",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("game_session_id", UUID(as_uuid=True), nullable=False),
        sa.Column("role_id", UUID(as_uuid=True), nullable=False),
        sa.Column("position", sa.Integer(), nullable=True),
        sa.Column("is_center", sa.Boolean(), nullable=False),
        sa.Column(
            "current_team",
            sa.Enum("VILLAGE", "WEREWOLF", "VAMPIRE", "ALIEN", "NEUTRAL", name="team"),
            nullable=True,
        ),
        sa.Column("is_flipped", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["game_session_id"],
            ["game_sessions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_game_roles_game_session_id"),
        "game_roles",
        ["game_session_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_game_roles_game_session_id"), table_name="game_roles")
    op.drop_table("game_roles")
    op.drop_index(op.f("ix_game_sessions_phase"), table_name="game_sessions")
    op.drop_index(op.f("ix_game_sessions_facilitator_id"), table_name="game_sessions")
    op.drop_table("game_sessions")
