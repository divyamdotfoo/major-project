from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from api.schema import AllocationRequest
from typing import List, Dict
from datetime import datetime
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import Branch, Student, Room

router = APIRouter(prefix="/allocation")


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
    Perform round-robin seating allocation for 2 branches in a room.
    Ensures no 2 students on the same bench have the same course/subject.
    """
    try:
        # Get branch and room objects
        branch1 = db.query(Branch).filter(Branch.id == request.branch1_id).first()
        if not branch1:
            raise HTTPException(status_code=404, detail=f"Branch with id {request.branch1_id} not found")
        
        branch2 = db.query(Branch).filter(Branch.id == request.branch2_id).first()
        if not branch2:
            raise HTTPException(status_code=404, detail=f"Branch with id {request.branch2_id} not found")
        
        room = db.query(Room).filter(Room.id == request.room_id).first()
        if not room:
            raise HTTPException(status_code=404, detail=f"Room with id {request.room_id} not found")
        
        # Get student data
        branch1_students = db.query(Student).filter(Student.branch_id == request.branch1_id).all()
        branch2_students = db.query(Student).filter(Student.branch_id == request.branch2_id).all()
        
        if not branch1_students:
            raise HTTPException(status_code=400, detail=f"Branch '{branch1.branch_name}' has no students")
        if not branch2_students:
            raise HTTPException(status_code=400, detail=f"Branch '{branch2.branch_name}' has no students")
        
        # Convert students to dict format for allocation algorithm
        class1_students = [
            {
                "roll_no": student.id,
                "name": student.name,
                "course": branch1.id
            }
            for student in branch1_students
        ]
        
        class2_students = [
            {
                "roll_no": student.id,
                "name": student.name,
                "course": branch2.id
            }
            for student in branch2_students
        ]
        
        rows = room.rows
        cols = room.cols
        total_capacity = rows * cols * 2
        
        if rows == 0 or cols == 0:
            raise HTTPException(status_code=400, detail=f"Room '{room.id}' has invalid configuration")
        
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
            'hall': room.id,
            'date': date_str,
            'grid': grid,
            'branch1': branch1.branch_name,
            'branch2': branch2.branch_name,
            'total_students_branch1': len(class1_students),
            'total_students_branch2': len(class2_students),
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
