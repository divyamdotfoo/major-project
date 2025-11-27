"""add seating plans table

Revision ID: add_seating_plans
Revises: 
Create Date: 2025-11-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_seating_plans'
down_revision = 'add_subjects_table'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'seating_plans',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('exam_date', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('allocation_data', sa.JSON(), nullable=False),
        sa.Column('total_students', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_rooms', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('data_source', sa.String(), nullable=False, server_default='existing'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_seating_plans_id'), 'seating_plans', ['id'], unique=False)
    op.create_index(op.f('ix_seating_plans_name'), 'seating_plans', ['name'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_seating_plans_name'), table_name='seating_plans')
    op.drop_index(op.f('ix_seating_plans_id'), table_name='seating_plans')
    op.drop_table('seating_plans')

