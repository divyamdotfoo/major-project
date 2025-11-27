from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import branches, students, room, allocation, subjects, seating_plans

app = FastAPI(
    title="Seating Allocation System API",
    description="API for managing branches, students, rooms, and seat allocations",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "message": "Seating Allocation System API",
        "version": "2.0.0",
        "endpoints": {
            "branches": "/branches",
            "students": "/students",
            "rooms": "/rooms",
            "subjects": "/subjects",
            "allocation": "/allocation",
            "seating_plans": "/seating-plans"
        }
    }


# Include routers
app.include_router(branches.router)
app.include_router(students.router)
app.include_router(room.router)
app.include_router(subjects.router)
app.include_router(allocation.router)
app.include_router(seating_plans.router)