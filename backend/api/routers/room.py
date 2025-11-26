from fastapi import APIRouter, HTTPException, Depends
from api.schema import RoomCreate
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from api.database import get_db
from api.models import Room

router=APIRouter(prefix="")

@router.get("/")
def read_root():
    return {"message": "Hello, World!"}


@router.post("/add-room")
async def add_room(room: RoomCreate, db: Session = Depends(get_db)):
    """
    Add a room with seating configuration.
    Stores the room data in the database.
    """
    try:
        # Validate inputs
        if room.rows <= 0 or room.cols <= 0:
            raise HTTPException(
                status_code=400,
                detail="rows and cols must be positive integers"
            )
        
        # Calculate total capacity
        total_capacity = room.rows * room.cols * 2
        
        # Check if room already exists
        existing_room = db.query(Room).filter(Room.room_name == room.room_name).first()
        
        if existing_room:
            # Update existing room
            existing_room.rows = room.rows
            existing_room.cols = room.cols
            existing_room.total_capacity = total_capacity
            existing_room.updated_at = datetime.now()
            message = f"Room '{room.room_name}' updated successfully"
            room_obj = existing_room
        else:
            # Create new room
            new_room = Room(
                room_name=room.room_name,
                rows=room.rows,
                cols=room.cols,
                total_capacity=total_capacity
            )
            db.add(new_room)
            message = f"Room '{room.room_name}' added successfully"
            room_obj = new_room
        
        db.commit()
        db.refresh(room_obj)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": message,
                "room_name": room_obj.room_name,
                "total_capacity": room_obj.total_capacity,
                "data": {
                    "room_name": room_obj.room_name,
                    "created_at": room_obj.created_at.isoformat() if room_obj.created_at else None,
                    "configuration": {
                        "rows": room_obj.rows,
                        "cols": room_obj.cols,
                        "total_capacity": room_obj.total_capacity
                    },
                    "layout": {
                        "total_rows": room_obj.rows,
                        "total_columns": room_obj.cols,
                        "seats_per_bench": 2
                    }
                }
            }
        )
    
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database integrity error")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error adding room: {str(e)}"
        )

@router.get("/rooms")
def list_rooms(db: Session = Depends(get_db)):
    """List all stored room data"""
    rooms = db.query(Room).order_by(Room.created_at.desc()).all()
    
    rooms_data = []
    for room_obj in rooms:
        rooms_data.append({
            "room_name": room_obj.room_name,
            "created_at": room_obj.created_at.isoformat() if room_obj.created_at else None,
            "total_capacity": room_obj.total_capacity
        })
    
    return {
        "total_rooms": len(rooms_data),
        "rooms": rooms_data
    }

@router.get("/rooms/{room_name}")
def get_room_data(room_name: str, db: Session = Depends(get_db)):
    """Retrieve data for a specific room by name"""
    room_obj = db.query(Room).filter(Room.room_name == room_name).first()
    
    if not room_obj:
        raise HTTPException(status_code=404, detail=f"Room '{room_name}' not found")
    
    return {
        "room_name": room_obj.room_name,
        "created_at": room_obj.created_at.isoformat() if room_obj.created_at else None,
        "configuration": {
            "rows": room_obj.rows,
            "cols": room_obj.cols,
            "total_capacity": room_obj.total_capacity
        },
        "layout": {
            "total_rows": room_obj.rows,
            "total_columns": room_obj.cols,
            "seats_per_bench": 2
        }
    }

