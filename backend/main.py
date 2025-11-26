from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import classes, room, allocation

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create data directories if they don't exist




app.include_router(classes.router)
app.include_router(room.router)
app.include_router(allocation.router)