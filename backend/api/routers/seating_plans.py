from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io

from api.database import get_db
from api.models import SeatingPlan, Student, Room, Subject, Branch
from api.schema import (
    SeatingPlanCreate,
    SeatingPlanUpdate,
    SeatingPlanResponse,
    SeatingPlanListResponse,
    ExistingDataRequest,
    ImportDataRequest,
    ImportStudentData,
    ImportRoomData
)

router = APIRouter(prefix="/seating-plans", tags=["seating-plans"])


def allocate_students_to_rooms(students_data: List[dict], rooms_data: List[dict]) -> dict:
    """
    Allocate students to rooms ensuring no two students with the same subject sit together.
    Returns allocation data structure.
    """
    allocations = []
    student_queue = students_data.copy()
    
    for room in rooms_data:
        room_id = room["room_id"]
        rows = room["rows"]
        cols = room["cols"]
        capacity = rows * cols * 2  # 2 students per bench
        
        # Group students by subject
        subject_groups = {}
        for student in student_queue[:]:
            subject = student["subject"]
            if subject not in subject_groups:
                subject_groups[subject] = []
            subject_groups[subject].append(student)
        
        # Allocate students to this room
        room_allocation = {
            "room_id": room_id,
            "rows": rows,
            "cols": cols,
            "grid": []
        }
        
        students_allocated = 0
        
        for row_idx in range(rows):
            row_data = []
            for col_idx in range(cols):
                bench = []
                
                # Try to find two students with different subjects
                if len(subject_groups) >= 2:
                    # Get two different subjects
                    subjects = list(subject_groups.keys())
                    subject1 = subjects[0]
                    subject2 = subjects[1]
                    
                    if subject_groups[subject1] and subject_groups[subject2]:
                        student1 = subject_groups[subject1].pop(0)
                        student2 = subject_groups[subject2].pop(0)
                        bench = [student1, student2]
                        student_queue.remove(student1)
                        student_queue.remove(student2)
                        students_allocated += 2
                        
                        # Clean up empty groups
                        if not subject_groups[subject1]:
                            del subject_groups[subject1]
                        if not subject_groups[subject2]:
                            del subject_groups[subject2]
                    elif subject_groups[subject1]:
                        student1 = subject_groups[subject1].pop(0)
                        bench = [student1]
                        student_queue.remove(student1)
                        students_allocated += 1
                        if not subject_groups[subject1]:
                            del subject_groups[subject1]
                elif len(subject_groups) == 1:
                    # Only one subject left
                    subject = list(subject_groups.keys())[0]
                    if subject_groups[subject]:
                        student1 = subject_groups[subject].pop(0)
                        bench = [student1]
                        student_queue.remove(student1)
                        students_allocated += 1
                        if not subject_groups[subject]:
                            del subject_groups[subject]
                
                row_data.append(bench)
                
                if students_allocated >= capacity or not student_queue:
                    break
            
            room_allocation["grid"].append(row_data)
            
            if students_allocated >= capacity or not student_queue:
                break
        
        allocations.append(room_allocation)
        
        if not student_queue:
            break
    
    return {
        "allocations": allocations,
        "unallocated_students": student_queue
    }


@router.post("/create-from-existing", response_model=SeatingPlanResponse)
async def create_plan_from_existing(
    request: ExistingDataRequest,
    db: Session = Depends(get_db)
):
    """Create a seating plan from existing data in the database"""
    try:
        # Fetch students
        students = db.query(Student).filter(Student.id.in_(request.student_ids)).all()
        if len(students) != len(request.student_ids):
            raise HTTPException(status_code=404, detail="Some students not found")
        
        # Fetch rooms
        rooms = db.query(Room).filter(Room.id.in_(request.room_ids)).all()
        if len(rooms) != len(request.room_ids):
            raise HTTPException(status_code=404, detail="Some rooms not found")
        
        # Fetch subjects
        subjects = db.query(Subject).filter(Subject.id.in_(request.subject_ids)).all()
        if len(subjects) != len(request.subject_ids):
            raise HTTPException(status_code=404, detail="Some subjects not found")
        
        # Create a mapping of student to subject (for simplicity, we'll assign subjects round-robin)
        # In a real system, you'd have a student-subject relationship
        subject_list = [s.id for s in subjects]
        subject_names = {s.id: s.name for s in subjects}
        branch_names = {b.id: b.branch_name for b in db.query(Branch).all()}
        
        students_data = []
        for idx, student in enumerate(students):
            assigned_subject = subject_list[idx % len(subject_list)]
            students_data.append({
                "roll_no": student.id,
                "name": student.name or student.id,
                "branch": student.branch_id,
                "branch_name": branch_names.get(student.branch_id, student.branch_id),
                "subject": assigned_subject,
                "subject_name": subject_names.get(assigned_subject, assigned_subject),
                "semester": student.semester
            })
        
        rooms_data = [
            {
                "room_id": room.id,
                "rows": room.rows,
                "cols": room.cols
            }
            for room in rooms
        ]
        
        # Perform allocation
        allocation_result = allocate_students_to_rooms(students_data, rooms_data)
        
        # Create seating plan
        plan = SeatingPlan(
            name=request.name,
            exam_date=request.exam_date,
            description=request.description,
            allocation_data=allocation_result,
            total_students=len(students),
            total_rooms=len(rooms),
            data_source="existing"
        )
        
        db.add(plan)
        db.commit()
        db.refresh(plan)
        
        return plan
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating plan: {str(e)}")


@router.post("/create-from-import", response_model=SeatingPlanResponse)
async def create_plan_from_import(
    request: ImportDataRequest,
    db: Session = Depends(get_db)
):
    """Create a seating plan from imported data"""
    try:
        # Convert imported data to the format needed for allocation
        # Get branch and subject names for display
        branches = db.query(Branch).all()
        subjects_db = db.query(Subject).all()
        branch_names = {b.id: b.branch_name for b in branches}
        subject_names = {s.id: s.name for s in subjects_db}
        
        students_data = [
            {
                "roll_no": student.roll_no,
                "name": student.roll_no,
                "branch": student.branch,
                "branch_name": branch_names.get(student.branch, student.branch),
                "subject": student.subject,
                "subject_name": subject_names.get(student.subject, student.subject),
                "semester": None
            }
            for student in request.students
        ]
        
        rooms_data = [
            {
                "room_id": room.room_id,
                "rows": room.rows,
                "cols": room.cols
            }
            for room in request.rooms
        ]
        
        # Perform allocation
        allocation_result = allocate_students_to_rooms(students_data, rooms_data)
        
        # Create seating plan
        plan = SeatingPlan(
            name=request.name,
            exam_date=request.exam_date,
            description=request.description,
            allocation_data=allocation_result,
            total_students=len(students_data),
            total_rooms=len(rooms_data),
            data_source="imported"
        )
        
        db.add(plan)
        db.commit()
        db.refresh(plan)
        
        return plan
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating plan from import: {str(e)}")


@router.post("/upload-students-xlsx")
async def upload_students_xlsx(file: UploadFile = File(...)):
    """Parse uploaded students CSV or Excel file and return data"""
    try:
        if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
            raise HTTPException(status_code=400, detail="File must be a CSV or Excel file (.csv, .xlsx, .xls)")
        
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Expected columns: roll_no, branch, subject
        required_columns = ['roll_no', 'branch', 'subject']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400,
                detail=f"Excel file must contain columns: {', '.join(required_columns)}"
            )
        
        students = []
        for _, row in df.iterrows():
            students.append({
                "roll_no": str(row['roll_no']),
                "branch": str(row['branch']),
                "subject": str(row['subject'])
            })
        
        return {"students": students}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing Excel file: {str(e)}")


@router.post("/upload-rooms-xlsx")
async def upload_rooms_xlsx(file: UploadFile = File(...)):
    """Parse uploaded rooms CSV or Excel file and return data"""
    try:
        if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
            raise HTTPException(status_code=400, detail="File must be a CSV or Excel file (.csv, .xlsx, .xls)")
        
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Expected columns: room_id, rows, cols
        required_columns = ['room_id', 'rows', 'cols']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400,
                detail=f"Excel file must contain columns: {', '.join(required_columns)}"
            )
        
        rooms = []
        for _, row in df.iterrows():
            rooms.append({
                "room_id": str(row['room_id']),
                "rows": int(row['rows']),
                "cols": int(row['cols'])
            })
        
        return {"rooms": rooms}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing Excel file: {str(e)}")


@router.get("/", response_model=List[SeatingPlanListResponse])
async def get_all_plans(db: Session = Depends(get_db)):
    """Get all seating plans"""
    plans = db.query(SeatingPlan).order_by(SeatingPlan.created_at.desc()).all()
    return plans


@router.get("/{plan_id}", response_model=SeatingPlanResponse)
async def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """Get a specific seating plan"""
    plan = db.query(SeatingPlan).filter(SeatingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Seating plan not found")
    return plan


@router.put("/{plan_id}", response_model=SeatingPlanResponse)
async def update_plan(
    plan_id: int,
    request: SeatingPlanUpdate,
    db: Session = Depends(get_db)
):
    """Update a seating plan"""
    plan = db.query(SeatingPlan).filter(SeatingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Seating plan not found")
    
    if request.name is not None:
        plan.name = request.name
    if request.exam_date is not None:
        plan.exam_date = request.exam_date
    if request.description is not None:
        plan.description = request.description
    
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}")
async def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    """Delete a seating plan"""
    plan = db.query(SeatingPlan).filter(SeatingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Seating plan not found")
    
    db.delete(plan)
    db.commit()
    return {"message": "Seating plan deleted successfully"}

