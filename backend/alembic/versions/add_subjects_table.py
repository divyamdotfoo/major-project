"""add_subjects_table

Revision ID: add_subjects_table
Revises: rename_columns_to_id
Create Date: 2025-11-26

This migration adds the subjects table for managing subject data.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_subjects_table'
down_revision = 'rename_columns_to_id'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add subjects table to the database.
    """
    op.create_table(
        'subjects',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_subjects_id', 'subjects', ['id'])
    op.create_index('ix_subjects_name', 'subjects', ['name'])


def downgrade():
    """
    Remove subjects table from the database.
    """
    op.drop_index('ix_subjects_name', 'subjects')
    op.drop_index('ix_subjects_id', 'subjects')
    op.drop_table('subjects')

