from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from typing import List
import pandas as pd
import io

from api.database import get_db
from api.models import Branch, Student
from api.schema import BranchCreate, BranchUpdate, BranchResponse

router = APIRouter(prefix="/branches", tags=["branches"])


@router.post("/", response_model=BranchResponse)
async def create_branch(branch: BranchCreate, db: Session = Depends(get_db)):
    """Create a new branch"""
    try:
        # Check if branch already exists
        existing_branch = db.query(Branch).filter(
            (Branch.branch_name == branch.branch_name) | 
            (Branch.id == branch.id)
        ).first()
        
        if existing_branch:
            raise HTTPException(
                status_code=400,
                detail="Branch with this name or id already exists"
            )
        
        db_branch = Branch(**branch.model_dump())
        db.add(db_branch)
        db.commit()
        db.refresh(db_branch)
        
        # Add student count
        response_data = BranchResponse.model_validate(db_branch)
        response_data.student_count = 0
        
        return response_data
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database integrity error")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating branch: {str(e)}")


@router.post("/bulk-upload")
async def bulk_upload_branches(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Bulk upload branches from CSV or Excel file.
    Expected columns: id (required), branch_name (required), description
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
        required_columns = ['id', 'branch_name']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}. Available columns: {', '.join(df.columns.tolist())}"
            )
        
        # Process branches
        created_branches = []
        errors = []
        
        for idx, row in df.iterrows():
            try:
                branch_id = str(row['id']).strip() if pd.notna(row['id']) else None
                branch_name = str(row['branch_name']).strip() if pd.notna(row['branch_name']) else None
                
                if not branch_id or not branch_name:
                    errors.append(f"Row {idx + 2}: Missing required fields (id or branch_name)")
                    continue
                
                # Check if branch already exists
                existing = db.query(Branch).filter(
                    (Branch.id == branch_id) | (Branch.branch_name == branch_name)
                ).first()
                if existing:
                    errors.append(f"Row {idx + 2}: Branch {branch_id} or {branch_name} already exists")
                    continue
                
                branch_data = {
                    "id": branch_id,
                    "branch_name": branch_name,
                    "description": str(row['description']).strip() if 'description' in df.columns and pd.notna(row.get('description')) else None,
                }
                
                db_branch = Branch(**branch_data)
                db.add(db_branch)
                created_branches.append(branch_id)
            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")
        
        if created_branches:
            db.commit()
        
        return JSONResponse(
            status_code=200,
            content={
                "message": f"Successfully created {len(created_branches)} branches",
                "created_count": len(created_branches),
                "error_count": len(errors),
                "created_branches": created_branches,
                "errors": errors
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/", response_model=List[BranchResponse])
def list_branches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all branches with student counts"""
    branches = db.query(Branch).offset(skip).limit(limit).all()
    
    response = []
    for branch in branches:
        branch_data = BranchResponse.model_validate(branch)
        # Get student count for this branch
        student_count = db.query(func.count(Student.id)).filter(Student.branch_id == branch.id).scalar()
        branch_data.student_count = student_count
        response.append(branch_data)
    
    return response


@router.get("/{id}", response_model=BranchResponse)
def get_branch(id: str, db: Session = Depends(get_db)):
    """Get a specific branch by id"""
    branch = db.query(Branch).filter(Branch.id == id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    branch_data = BranchResponse.model_validate(branch)
    student_count = db.query(func.count(Student.id)).filter(Student.branch_id == branch.id).scalar()
    branch_data.student_count = student_count
    
    return branch_data


@router.get("/{id}/students")
def get_branch_students(id: str, db: Session = Depends(get_db)):
    """Get all students in a specific branch"""
    branch = db.query(Branch).filter(Branch.id == id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    students = db.query(Student).filter(Student.branch_id == id).all()
    
    return {
        "branch_id": branch.id,
        "branch_name": branch.branch_name,
        "total_students": len(students),
        "students": students
    }


@router.put("/{id}", response_model=BranchResponse)
def update_branch(id: str, branch: BranchUpdate, db: Session = Depends(get_db)):
    """Update a branch"""
    db_branch = db.query(Branch).filter(Branch.id == id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    try:
        # Update only provided fields
        update_data = branch.model_dump(exclude_unset=True)
        
        # Check if new name conflicts with existing branches
        if "branch_name" in update_data:
            existing = db.query(Branch).filter(
                Branch.id != id,
                Branch.branch_name == update_data.get("branch_name")
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Branch with this name already exists"
                )
        
        for field, value in update_data.items():
            setattr(db_branch, field, value)
        
        db.commit()
        db.refresh(db_branch)
        
        branch_data = BranchResponse.model_validate(db_branch)
        student_count = db.query(func.count(Student.id)).filter(Student.branch_id == db_branch.id).scalar()
        branch_data.student_count = student_count
        
        return branch_data
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database integrity error")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating branch: {str(e)}")


@router.delete("/{id}")
def delete_branch(id: str, force: bool = False, db: Session = Depends(get_db)):
    """
    Delete a branch.
    If force=True, will also delete all students in the branch.
    Otherwise, will fail if branch has students.
    """
    branch = db.query(Branch).filter(Branch.id == id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    try:
        # Check if branch has students
        student_count = db.query(func.count(Student.id)).filter(Student.branch_id == id).scalar()
        
        if student_count > 0 and not force:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete branch with {student_count} students. Use force=true to delete anyway."
            )
        
        db.delete(branch)
        db.commit()
        return {"message": "Branch deleted successfully", "students_deleted": student_count}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting branch: {str(e)}")

