# Seating Allocation System

A web-based application for managing examination seating arrangements with support for branch management, student records, and room configurations.

## Architecture

**Backend:** FastAPI with SQLAlchemy ORM and PostgreSQL  
**Frontend:** Next.js 15 with TypeScript and Tailwind CSS  
**Database:** PostgreSQL with Alembic migrations

## Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher

## Installation

### Backend Setup

```bash
cd backend

# Install dependencies
uv sync

# Configure database connection (update as needed)
export DATABASE_URL="postgresql://user:password@localhost/seating_db"

# Run migrations
alembic upgrade head

# Start server
uvicorn main:app --reload
```

Backend will be available at `http://localhost:8000`  
API documentation at `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Database Schema

### Branch
Academic departments (CSE, ECE, etc.)
- Primary fields: branch_name, branch_code, description
- Relationship: One-to-many with students

### Student  
Individual student records with foreign key to branch
- Primary fields: roll_no (unique), name, email (unique), phone, branch_id, year, semester
- Relationship: Many-to-one with branch

### Room
Examination room configurations
- Primary fields: room_name (unique), room_number, building, rows, cols, total_capacity
- Capacity calculated as: rows × cols × 2 (students per bench)

## API Endpoints

### Branches
```
POST   /branches/              Create branch
GET    /branches/              List all branches
GET    /branches/{id}          Get branch details
GET    /branches/{id}/students Get students by branch
PUT    /branches/{id}          Update branch
DELETE /branches/{id}          Delete branch
```

### Students
```
POST   /students/              Create student
POST   /students/bulk-upload   Upload Excel file
GET    /students/              List students (optional: ?branch_id=)
GET    /students/{id}          Get student by ID
GET    /students/roll/{roll}   Get student by roll number
PUT    /students/{id}          Update student
DELETE /students/{id}          Delete student
```

### Rooms
```
POST   /rooms/                 Create room
GET    /rooms/                 List rooms
GET    /rooms/{id}             Get room details
PUT    /rooms/{id}             Update room
DELETE /rooms/{id}             Delete room
```

## Bulk Student Upload

The system supports bulk student upload via Excel files (.xlsx, .xls).

**Required column:** `roll_no`  
**Optional columns:** `name`, `email`, `phone`, `year`, `semester`

Example format:

| roll_no | name | email | phone | year | semester |
|---------|------|-------|-------|------|----------|
| 21CS001 | John Doe | john@example.com | 1234567890 | 3 | 5 |

Upload via UI at `/students` or via API:

```bash
curl -X POST http://localhost:8000/students/bulk-upload \
  -F "file=@students.xlsx" \
  -F "branch_id=1"
```

## Application Structure

```
backend/
├── api/
│   ├── routers/         # API route handlers
│   ├── models.py        # SQLAlchemy models
│   ├── schema.py        # Pydantic schemas
│   └── database.py      # Database configuration
├── alembic/             # Database migrations
└── main.py              # Application entry point

frontend/
├── app/                 # Next.js pages
│   ├── branches/        # Branch management
│   ├── students/        # Student management
│   ├── rooms/           # Room management
│   └── allocations/     # Seat allocations
└── components/          # Reusable UI components
```

## Usage

1. Start both backend and frontend servers
2. Navigate to `http://localhost:3000`
3. Create branches under `/branches`
4. Add students individually or via bulk upload at `/students`
5. Configure rooms at `/rooms`
6. View statistics on the dashboard

## Development

### Running Tests
```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

### Database Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Deployment

### Backend
```bash
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend
```bash
npm run build
npm start
```

## Notes

- All API responses follow consistent JSON structure
- Database constraints ensure data integrity (unique roll numbers, emails)
- CORS is configured for local development (localhost:3000)
- Room capacity automatically calculated based on layout dimensions
- Student-branch relationships enforced via foreign keys
