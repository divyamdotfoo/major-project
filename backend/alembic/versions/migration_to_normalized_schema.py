"""Migration to normalized schema with Branch and Student models

Revision ID: normalized_schema_001
Revises: 0722021b81e1
Create Date: 2025-11-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'normalized_schema_001'
down_revision: Union[str, Sequence[str], None] = '0722021b81e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to normalized structure."""
    
    # Drop the old classes table
    op.drop_index('ix_classes_id', table_name='classes')
    op.drop_index('ix_classes_class_name', table_name='classes')
    op.drop_table('classes')
    
    # Create new branches table
    op.create_table('branches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('branch_name', sa.String(), nullable=False),
        sa.Column('branch_code', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_branches_id'), 'branches', ['id'], unique=False)
    op.create_index(op.f('ix_branches_branch_name'), 'branches', ['branch_name'], unique=True)
    op.create_index(op.f('ix_branches_branch_code'), 'branches', ['branch_code'], unique=True)
    
    # Create new students table
    op.create_table('students',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('roll_no', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('branch_id', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('semester', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['branch_id'], ['branches.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_students_id'), 'students', ['id'], unique=False)
    op.create_index(op.f('ix_students_roll_no'), 'students', ['roll_no'], unique=True)
    op.create_index(op.f('ix_students_email'), 'students', ['email'], unique=True)
    
    # Update rooms table - add new columns
    op.add_column('rooms', sa.Column('room_number', sa.String(), nullable=True))
    op.add_column('rooms', sa.Column('building', sa.String(), nullable=True))
    op.create_index(op.f('ix_rooms_room_number'), 'rooms', ['room_number'], unique=True)


def downgrade() -> None:
    """Downgrade schema back to original structure."""
    
    # Drop new tables
    op.drop_index(op.f('ix_students_email'), table_name='students')
    op.drop_index(op.f('ix_students_roll_no'), table_name='students')
    op.drop_index(op.f('ix_students_id'), table_name='students')
    op.drop_table('students')
    
    op.drop_index(op.f('ix_branches_branch_code'), table_name='branches')
    op.drop_index(op.f('ix_branches_branch_name'), table_name='branches')
    op.drop_index(op.f('ix_branches_id'), table_name='branches')
    op.drop_table('branches')
    
    # Remove new columns from rooms
    op.drop_index(op.f('ix_rooms_room_number'), table_name='rooms')
    op.drop_column('rooms', 'building')
    op.drop_column('rooms', 'room_number')
    
    # Recreate old classes table
    op.create_table('classes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('class_name', sa.String(), nullable=False),
        sa.Column('total_students', sa.Integer(), nullable=False),
        sa.Column('students', sa.JSON(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_classes_class_name'), 'classes', ['class_name'], unique=True)
    op.create_index(op.f('ix_classes_id'), 'classes', ['id'], unique=False)

