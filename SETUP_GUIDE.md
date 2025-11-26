# Seating Allocation System - Setup Guide

I've cleaned up the Next.js boilerplate and created a modern frontend that connects to your FastAPI backend. Here's what has been done and how to get started:

## What's Been Done

### Frontend Changes
- Removed all Next.js boilerplate code
- Created a clean, modern dashboard that displays:
  - All classes with student counts
  - All rooms with capacity information
  - Detailed views for each class (showing all students)
  - Detailed views for each room (showing configuration)
- Connected to backend API endpoints
- Added proper error handling and loading states
- Updated page title and metadata

### Backend Structure (Already in place)
- FastAPI backend with SQLAlchemy ORM
- Three main endpoints:
  - `/add-class` - Upload Excel files with student data
  - `/add-room` - Add room configurations
  - `/allocation/allocate-seats` - Allocate seats for two classes

## How to Run

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file with your database URL:
   ```bash
   echo "DATABASE_URL=postgresql://username:password@localhost:5432/seating_allocation" > .env
   ```
   (Replace with your actual database credentials)

3. Install dependencies (using uv):
   ```bash
   uv sync
   ```

4. Run database migrations:
   ```bash
   alembic upgrade head
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

   The backend will be running at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be running at `http://localhost:3000`

## Testing the Connection

1. Open your browser and go to `http://localhost:3000`
2. You should see the dashboard with sections for Classes and Rooms
3. If the backend is running properly, any existing classes and rooms will be displayed
4. If there's no data, you'll see empty states with helpful messages

## Adding Sample Data

### Add a Class
Use this curl command or any API client like Postman:
```bash
curl -X POST "http://localhost:8000/add-class" \
  -F "class_name=CSE-A" \
  -F "file=@path/to/your/students.xlsx"
```

The Excel file should have columns: `roll_no` and `course`

### Add a Room
```bash
curl -X POST "http://localhost:8000/add-room" \
  -H "Content-Type: application/json" \
  -d '{
    "room_name": "Hall A",
    "rows": 10,
    "cols": 5
  }'
```

## Next Steps

Now that the frontend is connected to your backend, you can:
1. Add more features to the dashboard
2. Create forms to add classes and rooms directly from the UI
3. Add the allocation functionality to the frontend
4. Implement authentication if needed
5. Add more visualizations for the seating arrangements

## Troubleshooting

### "Failed to fetch data from backend" error
- Make sure the backend is running on `http://localhost:8000`
- Check if CORS is properly configured (already set in `main.py`)
- Verify your database connection

### Empty dashboard
- This is normal if you haven't added any classes or rooms yet
- Use the API endpoints to add sample data
- Refresh the page after adding data

## Project Structure

```
major-project/
├── backend/
│   ├── api/
│   │   ├── routers/
│   │   │   ├── classes.py      # Class management endpoints
│   │   │   ├── room.py         # Room management endpoints
│   │   │   └── allocation.py   # Seat allocation logic
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── schema.py           # Pydantic schemas
│   │   └── database.py         # Database configuration
│   └── main.py                 # FastAPI app entry point
└── frontend/
    └── app/
        ├── page.tsx            # Main dashboard (cleaned up)
        ├── layout.tsx          # Root layout
        └── globals.css         # Global styles
```


