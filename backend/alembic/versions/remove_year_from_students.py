"""remove year from students

Revision ID: remove_year_from_students
Revises: normalized_schema_001
Create Date: 2025-11-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'remove_year_from_students'
down_revision: Union[str, None] = 'normalized_schema_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove year column from students table
    op.drop_column('students', 'year')


def downgrade() -> None:
    # Add year column back if we need to rollback
    op.add_column('students', sa.Column('year', sa.Integer(), nullable=True))

