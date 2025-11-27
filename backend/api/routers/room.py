from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from api.schema import RoomCreate, RoomUpdate, RoomResponse
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from typing import List
import pandas as pd
import io

from api.database import get_db
from api.models import Room

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.post("/", response_model=RoomResponse)
async def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    """Create a new room with seating configuration"""
    try:
        # Validate inputs
        if room.rows <= 0 or room.cols <= 0:
            raise HTTPException(
                status_code=400,
                detail="rows and cols must be positive integers"
            )
        
        # Check if room already exists
        existing_room = db.query(Room).filter(Room.id == room.id).first()
        if existing_room:
            raise HTTPException(
                status_code=400,
                detail=f"Room with id '{room.id}' already exists"
            )
        
        # Create new room
        db_room = Room(**room.model_dump())
        db.add(db_room)
        db.commit()
        db.refresh(db_room)
        
        return db_room
    
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database integrity error")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error creating room: {str(e)}"
        )

@router.post("/bulk-upload")
async def bulk_upload_rooms(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Bulk upload rooms from CSV or Excel file.
    Expected columns: id (required), rows (required), cols (required)
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=400,
            detail="File must be a CSV or Excel file (.csv, .xlsx, .xls)"
        )
    
    try:
        # Read file based on extension
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        df.columns = df.columns.str.strip().str.lower()
        
        # Check required columns
        required_columns = ['id', 'rows', 'cols']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}. Available columns: {', '.join(df.columns.tolist())}"
            )
        
        # Process rooms
        created_rooms = []
        errors = []
        
        for idx, row in df.iterrows():
            try:
                room_id = str(row['id']).strip() if pd.notna(row['id']) else None
                if not room_id:
                    continue
                
                rows_val = int(row['rows']) if pd.notna(row['rows']) else None
                cols_val = int(row['cols']) if pd.notna(row['cols']) else None
                
                if not rows_val or not cols_val or rows_val <= 0 or cols_val <= 0:
                    errors.append(f"Row {idx + 2}: Invalid rows or cols values")
                    continue
                
                # Check if room already exists
                existing = db.query(Room).filter(Room.id == room_id).first()
                if existing:
                    errors.append(f"Row {idx + 2}: Room '{room_id}' already exists")
                    continue
                
                room_data = {
                    "id": room_id,
                    "rows": rows_val,
                    "cols": cols_val
                }
                
                db_room = Room(**room_data)
                db.add(db_room)
                created_rooms.append(room_id)
            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")
        
        if created_rooms:
            db.commit()
        
        return JSONResponse(
            status_code=200,
            content={
                "message": f"Successfully created {len(created_rooms)} rooms",
                "created_count": len(created_rooms),
                "error_count": len(errors),
                "created_rooms": created_rooms,
                "errors": errors
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/", response_model=List[RoomResponse])
def list_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all rooms"""
    rooms = db.query(Room).offset(skip).limit(limit).all()
    return rooms


@router.get("/{id}", response_model=RoomResponse)
def get_room(id: str, db: Session = Depends(get_db)):
    """Get a specific room by id"""
    room = db.query(Room).filter(Room.id == id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.put("/{id}", response_model=RoomResponse)
def update_room(id: str, room: RoomUpdate, db: Session = Depends(get_db)):
    """Update a room"""
    db_room = db.query(Room).filter(Room.id == id).first()
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    try:
        update_data = room.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_room, field, value)
        
        db.commit()
        db.refresh(db_room)
        return db_room
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database integrity error")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating room: {str(e)}")


@router.delete("/{id}")
def delete_room(id: str, db: Session = Depends(get_db)):
    """Delete a room"""
    room = db.query(Room).filter(Room.id == id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    try:
        db.delete(room)
        db.commit()
        return {"message": "Room deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting room: {str(e)}")

