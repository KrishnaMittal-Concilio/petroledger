"""Add narration_summary column to reconciliation_results

Revision ID: 040
Revises: 039
Create Date: 2026-05-02
"""

import sqlalchemy as sa
from alembic import op

revision = "040"
down_revision = "039"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "reconciliation_results",
        sa.Column("narration_summary", sa.String(2000), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("reconciliation_results", "narration_summary")
