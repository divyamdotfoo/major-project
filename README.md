# Exam Seating Allocation System

A comprehensive web application for managing exam seating allocations with branch, student, room, and subject management.

## Features

- Branch Management - Create and manage academic branches/departments
- Student Management - Add students individually or via bulk upload
- Room Management - Configure examination rooms with seating layouts
- Subject Management - Manage subjects for examinations
- Seating Plans - Generate automated seating arrangements
- Allocation System - Allocate students to rooms with smart seat assignment

## Tech Stack

### Frontend
- Next.js 16 with React 19
- TypeScript
- Tailwind CSS
- Radix UI components

### Backend
- Next.js API Routes (serverless functions)
- Drizzle ORM
- SQLite database

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd major-project
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Initialize the database:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
major-project/
├── frontend/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── branches/
│   │   │   ├── students/
│   │   │   ├── rooms/
│   │   │   ├── subjects/
│   │   │   ├── seating-plans/
│   │   │   └── allocation/
│   │   ├── branches/      # Branch management page
│   │   ├── students/      # Student management page
│   │   ├── rooms/         # Room management page
│   │   ├── subjects/      # Subject management page
│   │   └── allocations/   # Seating allocation page
│   ├── components/        # Reusable UI components
│   ├── db/               # Database schema and connection
│   └── lib/              # Utility functions and config
└── backend/              # (Legacy - no longer used)
```

## API Endpoints

### Branches
- `GET /api/branches` - Get all branches
- `POST /api/branches` - Create a new branch
- `GET /api/branches/[id]` - Get a specific branch
- `PUT /api/branches/[id]` - Update a branch
- `DELETE /api/branches/[id]` - Delete a branch
- `POST /api/branches/bulk-upload` - Bulk upload branches from Excel/CSV

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create a new student
- `GET /api/students/[id]` - Get a specific student
- `PUT /api/students/[id]` - Update a student
- `DELETE /api/students/[id]` - Delete a student
- `POST /api/students/bulk-upload` - Bulk upload students from Excel/CSV

### Rooms
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create a new room
- `GET /api/rooms/[id]` - Get a specific room
- `PUT /api/rooms/[id]` - Update a room
- `DELETE /api/rooms/[id]` - Delete a room
- `POST /api/rooms/bulk-upload` - Bulk upload rooms from Excel/CSV

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create a new subject
- `GET /api/subjects/[id]` - Get a specific subject
- `PUT /api/subjects/[id]` - Update a subject
- `DELETE /api/subjects/[id]` - Delete a subject
- `POST /api/subjects/bulk-upload` - Bulk upload subjects from Excel/CSV

### Seating Plans
- `GET /api/seating-plans` - Get all seating plans
- `GET /api/seating-plans/[id]` - Get a specific seating plan
- `PUT /api/seating-plans/[id]` - Update a seating plan
- `DELETE /api/seating-plans/[id]` - Delete a seating plan
- `POST /api/seating-plans/create-from-existing` - Create plan from existing data
- `POST /api/seating-plans/create-from-import` - Create plan from imported data
- `POST /api/seating-plans/upload-students-xlsx` - Parse student Excel file
- `POST /api/seating-plans/upload-rooms-xlsx` - Parse room Excel file

### Allocation
- `POST /api/allocation/allocate-seats` - Allocate seats for two branches in a room

## Bulk Upload Format

### Branches
Required columns: `id`, `branch_name`
Optional columns: `description`

### Students
Required columns: `id`, `branch`
Optional columns: `name`, `email`, `phone`, `semester`

### Rooms
Required columns: `id`, `rows`, `cols`

### Subjects
Required columns: `id`, `name`

## Database Schema

The application uses SQLite with the following tables:
- `branches` - Academic branches/departments
- `students` - Student records
- `rooms` - Examination rooms
- `subjects` - Subjects for examination
- `seating_plans` - Saved seating arrangements

## Deployment

The application can be deployed to any platform that supports Next.js:

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Deploy (automatic)

### Other Platforms
- Netlify
- Railway
- AWS Amplify
- Self-hosted with Docker

## Notes

- The SQLite database is stored locally as `sqlite.db`
- All API routes are serverless functions
- The application supports bulk uploads via Excel (.xlsx, .xls) or CSV files
- Seating allocation ensures students with different subjects sit together
