from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import pandas as pd
import io

from api.database import get_db
from api.models import Student, Branch
from api.schema import StudentCreate, StudentUpdate, StudentResponse

router = APIRouter(prefix="/students", tags=["students"])


@router.post("/", response_model=StudentResponse)
async def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    """Create a new student"""
    try:
        # Check if branch exists
        branch = db.query(Branch).filter(Branch.id == student.branch_id).first()
        if not branch:
            raise HTTPException(status_code=404, detail=f"Branch with id {student.branch_id} not found")
        
        # Check if id already exists
        existing_student = db.query(Student).filter(Student.id == student.id).first()
        if existing_student:
            raise HTTPException(status_code=400, detail=f"Student with id {student.id} already exists")
        
        db_student = Student(**student.model_dump())
        db.add(db_student)
        db.commit()
        db.refresh(db_student)
        
        return db_student
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database integrity error")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating student: {str(e)}")


@router.post("/bulk-upload")
async def bulk_upload_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Bulk upload students from CSV or Excel file.
    Expected columns: id (required), branch (required), name, email, phone, semester
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
        required_columns = ['id', 'branch']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}. Available columns: {', '.join(df.columns.tolist())}"
            )
        
        # Process students
        created_students = []
        errors = []
        
        for idx, row in df.iterrows():
            try:
                student_id = str(row['id']).strip() if pd.notna(row['id']) else None
                branch_id = str(row['branch']).strip() if pd.notna(row['branch']) else None
                
                if not student_id or not branch_id:
                    errors.append(f"Row {idx + 2}: Missing required fields (id or branch)")
                    continue
                
                # Check if branch exists
                branch = db.query(Branch).filter(Branch.id == branch_id).first()
                if not branch:
                    errors.append(f"Row {idx + 2}: Branch '{branch_id}' not found")
                    continue
                
                # Check if student already exists
                existing = db.query(Student).filter(Student.id == student_id).first()
                if existing:
                    errors.append(f"Row {idx + 2}: Student {student_id} already exists")
                    continue
                
                student_data = {
                    "id": student_id,
                    "branch_id": branch_id,
                    "name": str(row['name']).strip() if 'name' in df.columns and pd.notna(row.get('name')) else None,
                    "email": str(row['email']).strip() if 'email' in df.columns and pd.notna(row.get('email')) else None,
                    "phone": str(row['phone']).strip() if 'phone' in df.columns and pd.notna(row.get('phone')) else None,
                    "semester": int(row['semester']) if 'semester' in df.columns and pd.notna(row.get('semester')) else None,
                }
                
                db_student = Student(**student_data)
                db.add(db_student)
                created_students.append(student_id)
            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")
        
        if created_students:
            db.commit()
        
        return JSONResponse(
            status_code=200,
            content={
                "message": f"Successfully created {len(created_students)} students",
                "created_count": len(created_students),
                "error_count": len(errors),
                "created_students": created_students,
                "errors": errors
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/", response_model=List[StudentResponse])
def list_students(
    skip: int = 0,
    limit: int = 100,
    branch_id: str = None,
    db: Session = Depends(get_db)
):
    """List all students with optional filtering by branch"""
    query = db.query(Student)
    
    if branch_id:
        query = query.filter(Student.branch_id == branch_id)
    
    students = query.offset(skip).limit(limit).all()
    return students


@router.get("/{id}", response_model=StudentResponse)
def get_student(id: str, db: Session = Depends(get_db)):
    """Get a specific student by ID"""
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.put("/{id}", response_model=StudentResponse)
def update_student(id: str, student: StudentUpdate, db: Session = Depends(get_db)):
    """Update a student"""
    db_student = db.query(Student).filter(Student.id == id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    try:
        # Update only provided fields
        update_data = student.model_dump(exclude_unset=True)
        
        # If branch_id is being updated, verify it exists
        if "branch_id" in update_data:
            branch = db.query(Branch).filter(Branch.id == update_data["branch_id"]).first()
            if not branch:
                raise HTTPException(status_code=404, detail=f"Branch with id {update_data['branch_id']} not found")
        
        for field, value in update_data.items():
            setattr(db_student, field, value)
        
        db.commit()
        db.refresh(db_student)
        return db_student
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database integrity error")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating student: {str(e)}")


@router.delete("/{id}")
def delete_student(id: str, db: Session = Depends(get_db)):
    """Delete a student"""
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    try:
        db.delete(student)
        db.commit()
        return {"message": "Student deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting student: {str(e)}")

