from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from api.schema import AllocationRequest
from typing import List, Dict
from datetime import datetime
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import Class, Room

router = APIRouter(prefix="/allocation")


def get_class_data(class_name: str, db: Session) -> dict:
    """Load class data by name from database"""
    class_obj = db.query(Class).filter(Class.class_name == class_name).first()
    
    if not class_obj:
        raise HTTPException(status_code=404, detail=f"Class '{class_name}' not found")
    
    return {
        "class_name": class_obj.class_name,
        "students": class_obj.students
    }


def get_room_data(room_name: str, db: Session) -> dict:
    """Load room data by name from database"""
    room_obj = db.query(Room).filter(Room.room_name == room_name).first()
    
    if not room_obj:
        raise HTTPException(status_code=404, detail=f"Room '{room_name}' not found")
    
    return {
        "room_name": room_obj.room_name,
        "configuration": {
            "rows": room_obj.rows,
            "cols": room_obj.cols,
            "total_capacity": room_obj.total_capacity
        }
    }


def allocate_seats_round_robin(
    class1_students: List[Dict],
    class2_students: List[Dict],
    rows: int,
    cols: int
) -> List[List[List[str]]]:
    """
    Round-robin seating allocation where 2 students from different classes 
    are paired together, ensuring no same course/subject.
    Each student is allocated only once. Unpaired students sit alone.
    """
    grid = []
    
    # Track which students have been used (by index to avoid duplicates)
    used_class1_indices = set()
    used_class2_indices = set()
    
    # Keep available lists (indices of unused students)
    available_class1_indices = list(range(len(class1_students)))
    available_class2_indices = list(range(len(class2_students)))
    
    for row in range(rows):
        row_data = []
        for col in range(cols):
            bench = []
            
            # Try to find an unused student from class1
            student1_index = None
            student1 = None
            
            if available_class1_indices:
                student1_index = available_class1_indices[0]
                student1 = class1_students[student1_index]
            
            # If no class1 student available, try class2 alone or leave empty
            if student1_index is None:
                # Try to find an unused student from class2 to seat alone
                if available_class2_indices:
                    student2_index = available_class2_indices[0]
                    student2 = class2_students[student2_index]
                    bench.append(student2['roll_no'])
                    used_class2_indices.add(student2_index)
                    available_class2_indices.remove(student2_index)
                else:
                    # No students left - empty bench
                    bench = []
                row_data.append(bench)
                continue
            
            # Try to find an unused student from class2 with different course
            found_pair = False
            student2_index = None
            
            for idx in available_class2_indices:
                student2 = class2_students[idx]
                
                # Check if courses are different
                if student1['course'] != student2['course']:
                    bench.append(student1['roll_no'])
                    bench.append(student2['roll_no'])
                    
                    # Mark both as used
                    used_class1_indices.add(student1_index)
                    used_class2_indices.add(idx)
                    available_class1_indices.remove(student1_index)
                    available_class2_indices.remove(idx)
                    found_pair = True
                    break
            
            # If no valid pair found with different course, try any unused student from class2
            if not found_pair and available_class2_indices:
                student2_index = available_class2_indices[0]
                student2 = class2_students[student2_index]
                bench.append(student1['roll_no'])
                bench.append(student2['roll_no'])
                
                # Mark both as used
                used_class1_indices.add(student1_index)
                used_class2_indices.add(student2_index)
                available_class1_indices.remove(student1_index)
                available_class2_indices.remove(student2_index)
                found_pair = True
            
            # If still no pair found (class2 exhausted), seat class1 student alone
            if not found_pair:
                bench.append(student1['roll_no'])
                used_class1_indices.add(student1_index)
                available_class1_indices.remove(student1_index)
            
            row_data.append(bench)
        
        grid.append(row_data)
    
    return grid


@router.post("/allocate-seats")
async def allocate_seats(request: AllocationRequest, db: Session = Depends(get_db)):
    """
    Perform round-robin seating allocation for 2 classes in a room.
    Ensures no 2 students on the same bench have the same course/subject.
    """
    try:
        # Load class and room data
        class1_data = get_class_data(request.class1_name, db)
        class2_data = get_class_data(request.class2_name, db)
        room_data = get_room_data(request.room_name, db)
        
        class1_students = class1_data.get('students', [])
        class2_students = class2_data.get('students', [])
        
        if not class1_students:
            raise HTTPException(status_code=400, detail=f"Class '{request.class1_name}' has no students")
        if not class2_students:
            raise HTTPException(status_code=400, detail=f"Class '{request.class2_name}' has no students")
        
        room_config = room_data.get('configuration', {})
        rows = room_config.get('rows', 0)
        cols = room_config.get('cols', 0)
        total_capacity = room_config.get('total_capacity', 0)
        
        if rows == 0 or cols == 0:
            raise HTTPException(status_code=400, detail=f"Room '{request.room_name}' has invalid configuration")
        
        # Check if room has enough capacity
        total_students = len(class1_students) + len(class2_students)
        if total_students > total_capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Total students ({total_students}) exceeds room capacity ({total_capacity})"
            )
        
        # Perform allocation
        grid = allocate_seats_round_robin(class1_students, class2_students, rows, cols)
        
        # Format date
        date_str = request.date if request.date else datetime.now().strftime("%dth %b %Y")
        
        # Create seating data structure
        seating_data = {
            'hall': room_data.get('room_name', request.room_name),
            'date': date_str,
            'grid': grid,
            'class1': request.class1_name,
            'class2': request.class2_name,
            'total_students_class1': len(class1_students),
            'total_students_class2': len(class2_students),
            'room_configuration': {
                'rows': rows,
                'cols': cols,
                'total_capacity': total_capacity
            }
        }
        
        return JSONResponse(
            status_code=200,
            content=seating_data
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error allocating seats: {str(e)}"
        )
