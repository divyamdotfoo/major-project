"""branch_code_as_primary_key

Revision ID: branch_code_pk
Revises: remove_year_from_students
Create Date: 2025-11-26

This migration changes the branches table to use branch_code as the primary key
instead of an auto-incrementing integer id, and updates the students table
foreign key accordingly.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'branch_code_pk'
down_revision = 'remove_year_from_students'
branch_labels = None
depends_on = None


def upgrade():
    """
    Upgrade database schema to use branch_code as primary key in branches table.
    """
    # Step 1: Add branch_code column to students table as temporary column
    op.add_column('students', sa.Column('branch_code_temp', sa.String(), nullable=True))
    
    # Step 2: Copy branch_code from branches to students.branch_code_temp based on branch_id
    op.execute("""
        UPDATE students 
        SET branch_code_temp = branches.branch_code 
        FROM branches 
        WHERE students.branch_id = branches.id
    """)
    
    # Step 3: Drop the foreign key constraint on students.branch_id
    op.drop_constraint('students_branch_id_fkey', 'students', type_='foreignkey')
    
    # Step 4: Drop the old branch_id column from students
    op.drop_column('students', 'branch_id')
    
    # Step 5: Drop the old primary key constraint on branches.id
    op.drop_constraint('branches_pkey', 'branches', type_='primary')
    
    # Step 6: Drop the old id column from branches
    op.drop_column('branches', 'id')
    
    # Step 7: Make branch_code the primary key in branches
    op.alter_column('branches', 'branch_code',
                    existing_type=sa.String(),
                    nullable=False)
    op.create_primary_key('branches_pkey', 'branches', ['branch_code'])
    
    # Step 8: Rename branch_code_temp to branch_code in students
    op.alter_column('students', 'branch_code_temp',
                    new_column_name='branch_code',
                    existing_type=sa.String(),
                    nullable=False)
    
    # Step 9: Create foreign key constraint on students.branch_code
    op.create_foreign_key('students_branch_code_fkey', 'students', 'branches',
                          ['branch_code'], ['branch_code'])
    
    # Step 10: Create index on students.branch_code for better query performance
    op.create_index('ix_students_branch_code', 'students', ['branch_code'])


def downgrade():
    """
    Downgrade database schema to restore integer id as primary key in branches table.
    """
    # Step 1: Drop index on students.branch_code
    op.drop_index('ix_students_branch_code', 'students')
    
    # Step 2: Drop foreign key constraint on students.branch_code
    op.drop_constraint('students_branch_code_fkey', 'students', type_='foreignkey')
    
    # Step 3: Add temporary branch_id column to students
    op.add_column('students', sa.Column('branch_id_temp', sa.Integer(), nullable=True))
    
    # Step 4: Add id column back to branches
    op.add_column('branches', sa.Column('id', sa.Integer(), autoincrement=True, nullable=True))
    
    # Step 5: Populate the id column with sequential values
    op.execute("""
        UPDATE branches 
        SET id = subquery.row_num
        FROM (
            SELECT branch_code, ROW_NUMBER() OVER (ORDER BY branch_code) as row_num
            FROM branches
        ) as subquery
        WHERE branches.branch_code = subquery.branch_code
    """)
    
    # Step 6: Make id not nullable
    op.alter_column('branches', 'id',
                    existing_type=sa.Integer(),
                    nullable=False)
    
    # Step 7: Drop the primary key constraint on branches.branch_code
    op.drop_constraint('branches_pkey', 'branches', type_='primary')
    
    # Step 8: Create primary key on branches.id
    op.create_primary_key('branches_pkey', 'branches', ['id'])
    
    # Step 9: Create index on branches.id
    op.create_index('ix_branches_id', 'branches', ['id'])
    
    # Step 10: Update students.branch_id_temp from branch_code join
    op.execute("""
        UPDATE students 
        SET branch_id_temp = branches.id 
        FROM branches 
        WHERE students.branch_code = branches.branch_code
    """)
    
    # Step 11: Make branch_id_temp not nullable
    op.alter_column('students', 'branch_id_temp',
                    existing_type=sa.Integer(),
                    nullable=False)
    
    # Step 12: Drop the branch_code column from students
    op.drop_column('students', 'branch_code')
    
    # Step 13: Rename branch_id_temp to branch_id
    op.alter_column('students', 'branch_id_temp',
                    new_column_name='branch_id',
                    existing_type=sa.Integer(),
                    nullable=False)
    
    # Step 14: Create foreign key constraint on students.branch_id
    op.create_foreign_key('students_branch_id_fkey', 'students', 'branches',
                          ['branch_id'], ['id'])

