"""Add superadmin and provider values to user_role enum

Revision ID: 039
Revises: 038
Create Date: 2026-05-02
"""

from alembic import op

revision = "039"
down_revision = "038"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin'")
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'provider'")


def downgrade() -> None:
    # Postgres does not support removing enum values; downgrade is a no-op.
    pass
