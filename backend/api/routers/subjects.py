from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import pandas as pd
import io

from api.database import get_db
from api.models import Subject
from api.schema import SubjectCreate, SubjectUpdate, SubjectResponse

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.post("/", response_model=SubjectResponse)
async def create_subject(subject: SubjectCreate, db: Session = Depends(get_db)):
    """Create a new subject"""
    try:
        # Check if subject already exists
        existing_subject = db.query(Subject).filter(
            (Subject.name == subject.name) | 
            (Subject.id == subject.id)
        ).first()
        
        if existing_subject:
            raise HTTPException(
                status_code=400,
                detail="Subject with this name or id already exists"
            )
        
        db_subject = Subject(**subject.model_dump())
        db.add(db_subject)
        db.commit()
        db.refresh(db_subject)
        
        return SubjectResponse.model_validate(db_subject)
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database integrity error")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating subject: {str(e)}")


@router.post("/bulk-upload")
async def bulk_upload_subjects(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Bulk upload subjects from CSV or Excel file.
    Expected columns: id (required), name (required)
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
        required_columns = ['id', 'name']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}. Available columns: {', '.join(df.columns.tolist())}"
            )
        
        # Process subjects
        created_subjects = []
        errors = []
        
        for idx, row in df.iterrows():
            try:
                subject_id = str(row['id']).strip() if pd.notna(row['id']) else None
                subject_name = str(row['name']).strip() if pd.notna(row['name']) else None
                
                if not subject_id or not subject_name:
                    errors.append(f"Row {idx + 2}: Missing id or name")
                    continue
                
                # Check if subject already exists
                existing = db.query(Subject).filter(
                    (Subject.id == subject_id) | (Subject.name == subject_name)
                ).first()
                if existing:
                    errors.append(f"Row {idx + 2}: Subject {subject_id} or {subject_name} already exists")
                    continue
                
                # Create subject
                new_subject = Subject(
                    id=subject_id,
                    name=subject_name
                )
                db.add(new_subject)
                created_subjects.append(subject_id)
                
            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")
        
        # Commit all changes
        db.commit()
        
        return {
            "message": f"Successfully created {len(created_subjects)} subjects",
            "created_count": len(created_subjects),
            "error_count": len(errors),
            "created_subjects": created_subjects,
            "errors": errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/", response_model=List[SubjectResponse])
def list_subjects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all subjects"""
    subjects = db.query(Subject).offset(skip).limit(limit).all()
    return [SubjectResponse.model_validate(subject) for subject in subjects]


@router.get("/{id}", response_model=SubjectResponse)
def get_subject(id: str, db: Session = Depends(get_db)):
    """Get a specific subject by id"""
    subject = db.query(Subject).filter(Subject.id == id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    return SubjectResponse.model_validate(subject)


@router.put("/{id}", response_model=SubjectResponse)
def update_subject(id: str, subject: SubjectUpdate, db: Session = Depends(get_db)):
    """Update a subject"""
    db_subject = db.query(Subject).filter(Subject.id == id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    try:
        # Update only provided fields
        update_data = subject.model_dump(exclude_unset=True)
        
        # Check if new name conflicts with existing subjects
        if "name" in update_data:
            existing = db.query(Subject).filter(
                Subject.id != id,
                Subject.name == update_data.get("name")
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Subject with this name already exists"
                )
        
        for field, value in update_data.items():
            setattr(db_subject, field, value)
        
        db.commit()
        db.refresh(db_subject)
        
        return SubjectResponse.model_validate(db_subject)
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database integrity error")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating subject: {str(e)}")


@router.delete("/{id}")
def delete_subject(id: str, db: Session = Depends(get_db)):
    """Delete a subject"""
    subject = db.query(Subject).filter(Subject.id == id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    try:
        db.delete(subject)
        db.commit()
        return {"message": "Subject deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting subject: {str(e)}")

