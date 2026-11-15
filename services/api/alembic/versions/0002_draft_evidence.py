"""Add version-bound drafting evidence without modifying existing records."""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "draft_evidence",
        sa.Column("version_id", sa.Integer(), sa.ForeignKey("document_versions.id"), primary_key=True),
        sa.Column("template_version_id", sa.Integer(), sa.ForeignKey("document_versions.id"), nullable=False),
        sa.Column("citations", sa.JSON(), nullable=False),
        sa.Column("recommendations", sa.Text(), nullable=False),
        sa.Column("reviewer_ids", sa.JSON(), nullable=False),
    )


def downgrade():
    op.drop_table("draft_evidence")
