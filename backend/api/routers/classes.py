import datetime
import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from api.database import get_db
from api.models import Class


router=APIRouter(prefix="")

@router.post("/add-class")
async def add_class(
    class_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload an Excel file containing roll_no and course fields.
    Stores the data in the database.
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="File must be an Excel file (.xlsx or .xls)"
        )
    
    try:
        # Read the Excel file into a pandas DataFrame
        df = pd.read_excel(await file.read())
        
        # Normalize column names (handle case-insensitive and whitespace)
        df.columns = df.columns.str.strip().str.lower()
        
        # Check if required columns exist
        required_columns = ['roll_no', 'course']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}. Available columns: {', '.join(df.columns.tolist())}"
            )
        
        # Extract and clean the data
        students_data = []
        for idx, row in df.iterrows():
            roll_no = str(row['roll_no']).strip() if pd.notna(row['roll_no']) else None
            course = str(row['course']).strip() if pd.notna(row['course']) else None
            
            # Skip rows with missing data
            if not roll_no or not course:
                continue
            
            students_data.append({
                "roll_no": roll_no,
                "course": course
            })
        
        if not students_data:
            raise HTTPException(
                status_code=400,
                detail="No valid student data found in the Excel file"
            )
        
        # Check if class already exists
        existing_class = db.query(Class).filter(Class.class_name == class_name).first()
        is_replacement = existing_class is not None
        
        if existing_class:
            # Update existing class
            existing_class.total_students = len(students_data)
            existing_class.students = students_data
            existing_class.updated_at = datetime.datetime.now()
            message = f"Class '{class_name}' replaced successfully"
        else:
            # Create new class
            new_class = Class(
                class_name=class_name,
                total_students=len(students_data),
                students=students_data
            )
            db.add(new_class)
            message = f"Class '{class_name}' added successfully"
        
        db.commit()
        
        if existing_class:
            db.refresh(existing_class)
            class_obj = existing_class
        else:
            db.refresh(new_class)
            class_obj = new_class
        
        return JSONResponse(
            status_code=200,
            content={
                "message": message,
                "class_name": class_name,
                "total_students": len(students_data),
                "replaced": is_replacement,
                "data": {
                    "class_name": class_obj.class_name,
                    "uploaded_at": class_obj.uploaded_at.isoformat() if class_obj.uploaded_at else None,
                    "total_students": class_obj.total_students,
                    "students": class_obj.students
                }
            }
        )
    
    except HTTPException:
        raise
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="The Excel file is empty")
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database integrity error")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )

@router.get("/classes")
def list_classes(db: Session = Depends(get_db)):
    """List all stored class data"""
    classes = db.query(Class).order_by(Class.uploaded_at.desc()).all()
    
    classes_data = []
    for class_obj in classes:
        classes_data.append({
            "class_name": class_obj.class_name,
            "uploaded_at": class_obj.uploaded_at.isoformat() if class_obj.uploaded_at else None,
            "total_students": class_obj.total_students
        })
    
    return {
        "total_classes": len(classes_data),
        "classes": classes_data
    }

@router.get("/classes/{class_name}")
def get_class_data(class_name: str, db: Session = Depends(get_db)):
    """Retrieve data for a specific class by name"""
    class_obj = db.query(Class).filter(Class.class_name == class_name).first()
    
    if not class_obj:
        raise HTTPException(status_code=404, detail=f"Class '{class_name}' not found")
    
    return {
        "class_name": class_obj.class_name,
        "uploaded_at": class_obj.uploaded_at.isoformat() if class_obj.uploaded_at else None,
        "total_students": class_obj.total_students,
        "students": class_obj.students
    }