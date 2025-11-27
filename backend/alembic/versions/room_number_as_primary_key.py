"""room_number_as_primary_key

Revision ID: room_number_pk
Revises: branch_code_pk
Create Date: 2025-11-26

This migration changes the rooms table to use room_number as the primary key
and removes unnecessary columns (id, room_name, building, total_capacity).
Only keeps room_number, rows, cols.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'room_number_pk'
down_revision = 'branch_code_pk'
branch_labels = None
depends_on = None


def upgrade():
    """
    Upgrade database schema to use room_number as primary key in rooms table.
    """
    # Step 1: Add room_number_temp column if room_number doesn't exist or is nullable
    # First, check if we need to populate room_number from existing data
    op.execute("""
        UPDATE rooms 
        SET room_number = COALESCE(room_number, 'ROOM' || id::text)
        WHERE room_number IS NULL
    """)
    
    # Step 2: Make room_number not nullable
    op.alter_column('rooms', 'room_number',
                    existing_type=sa.String(),
                    nullable=False)
    
    # Step 3: Drop the old primary key constraint on rooms.id
    op.drop_constraint('rooms_pkey', 'rooms', type_='primary')
    
    # Step 4: Drop unnecessary columns
    op.drop_column('rooms', 'id')
    op.drop_column('rooms', 'room_name')
    op.drop_column('rooms', 'building')
    op.drop_column('rooms', 'total_capacity')
    
    # Step 5: Create new primary key on room_number
    op.create_primary_key('rooms_pkey', 'rooms', ['room_number'])


def downgrade():
    """
    Downgrade database schema to restore integer id as primary key in rooms table.
    """
    # Step 1: Drop the primary key constraint on rooms.room_number
    op.drop_constraint('rooms_pkey', 'rooms', type_='primary')
    
    # Step 2: Add back the id column
    op.add_column('rooms', sa.Column('id', sa.Integer(), autoincrement=True, nullable=True))
    
    # Step 3: Populate the id column with sequential values
    op.execute("""
        UPDATE rooms 
        SET id = subquery.row_num
        FROM (
            SELECT room_number, ROW_NUMBER() OVER (ORDER BY room_number) as row_num
            FROM rooms
        ) as subquery
        WHERE rooms.room_number = subquery.room_number
    """)
    
    # Step 4: Make id not nullable
    op.alter_column('rooms', 'id',
                    existing_type=sa.Integer(),
                    nullable=False)
    
    # Step 5: Add back the removed columns
    op.add_column('rooms', sa.Column('room_name', sa.String(), nullable=True))
    op.add_column('rooms', sa.Column('building', sa.String(), nullable=True))
    op.add_column('rooms', sa.Column('total_capacity', sa.Integer(), nullable=True))
    
    # Step 6: Populate room_name from room_number and calculate total_capacity
    op.execute("""
        UPDATE rooms 
        SET room_name = 'Room ' || room_number,
            total_capacity = rows * cols * 2
    """)
    
    # Step 7: Make room_name not nullable
    op.alter_column('rooms', 'room_name',
                    existing_type=sa.String(),
                    nullable=False)
    
    # Step 8: Make total_capacity not nullable
    op.alter_column('rooms', 'total_capacity',
                    existing_type=sa.Integer(),
                    nullable=False)
    
    # Step 9: Create primary key on id
    op.create_primary_key('rooms_pkey', 'rooms', ['id'])
    
    # Step 10: Create index on id
    op.create_index('ix_rooms_id', 'rooms', ['id'])
    
    # Step 11: Create unique constraint on room_name
    op.create_unique_constraint('rooms_room_name_key', 'rooms', ['room_name'])
    
    # Step 12: Make room_number nullable again
    op.alter_column('rooms', 'room_number',
                    existing_type=sa.String(),
                    nullable=True)

