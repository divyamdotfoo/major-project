"""rename columns to id

Revision ID: rename_columns_to_id
Revises: room_number_pk
Create Date: 2025-11-26 12:00:00.000000

This migration renames columns to just 'id' for cleaner API:
- branches.branch_code -> branches.id
- rooms.room_number -> rooms.id
- students.roll_no -> students.id (and removes old integer id column)
- students.branch_code -> students.branch_id
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'rename_columns_to_id'
down_revision = 'room_number_pk'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Rename branches.branch_code to branches.id
    # First drop the foreign key constraint from students table
    op.drop_constraint('students_branch_code_fkey', 'students', type_='foreignkey')
    
    # Drop index on branch_code if it exists
    op.execute("DROP INDEX IF EXISTS ix_students_branch_code")
    
    # Rename the column in branches table
    op.alter_column('branches', 'branch_code', new_column_name='id')
    
    # Step 2: Rename students.branch_code to students.branch_id and update foreign key
    op.alter_column('students', 'branch_code', new_column_name='branch_id')
    
    # Recreate the foreign key constraint with new column names
    op.create_foreign_key('students_branch_id_fkey', 'students', 'branches', ['branch_id'], ['id'])
    
    # Create index on students.branch_id
    op.create_index('ix_students_branch_id', 'students', ['branch_id'])
    
    # Step 3: Rename rooms.room_number to rooms.id
    op.alter_column('rooms', 'room_number', new_column_name='id')
    
    # Step 4: For students table - remove old id column and rename roll_no to id
    # First, drop the old primary key constraint
    op.drop_constraint('students_pkey', 'students', type_='primary')
    
    # Drop the old integer id column
    op.drop_column('students', 'id')
    
    # Then rename roll_no to id
    op.alter_column('students', 'roll_no', new_column_name='id')
    
    # Make the new id column the primary key
    op.create_primary_key('students_pkey', 'students', ['id'])


def downgrade():
    # Reverse Step 4: Restore students table structure
    op.drop_constraint('students_pkey', 'students', type_='primary')
    
    # Rename id back to roll_no
    op.alter_column('students', 'id', new_column_name='roll_no')
    
    # Add back the integer id column
    op.add_column('students', sa.Column('id', sa.Integer(), autoincrement=True, nullable=True))
    
    # Populate id with sequential values
    op.execute("""
        UPDATE students 
        SET id = subquery.row_num
        FROM (
            SELECT roll_no, ROW_NUMBER() OVER (ORDER BY roll_no) as row_num
            FROM students
        ) as subquery
        WHERE students.roll_no = subquery.roll_no
    """)
    
    # Make id not nullable
    op.alter_column('students', 'id',
                    existing_type=sa.Integer(),
                    nullable=False)
    
    # Create primary key on id
    op.create_primary_key('students_pkey', 'students', ['id'])
    
    # Reverse Step 3: Rename rooms.id back to rooms.room_number
    op.alter_column('rooms', 'id', new_column_name='room_number')
    
    # Reverse Step 2: Rename students.branch_id back to students.branch_code
    op.drop_constraint('students_branch_id_fkey', 'students', type_='foreignkey')
    op.drop_index('ix_students_branch_id', 'students')
    op.alter_column('students', 'branch_id', new_column_name='branch_code')
    
    # Reverse Step 1: Rename branches.id back to branches.branch_code
    op.alter_column('branches', 'id', new_column_name='branch_code')
    
    # Recreate the original foreign key constraint
    op.create_foreign_key('students_branch_code_fkey', 'students', 'branches', ['branch_code'], ['branch_code'])
    
    # Recreate index
    op.create_index('ix_students_branch_code', 'students', ['branch_code'])

