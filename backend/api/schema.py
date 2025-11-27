from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


# Branch Schemas
class BranchBase(BaseModel):
    id: str
    branch_name: str
    description: Optional[str] = None


class BranchCreate(BranchBase):
    pass


class BranchUpdate(BaseModel):
    branch_name: Optional[str] = None
    description: Optional[str] = None


class BranchResponse(BranchBase):
    created_at: datetime
    updated_at: Optional[datetime] = None
    student_count: Optional[int] = None

    class Config:
        from_attributes = True


# Student Schemas
class StudentBase(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    branch_id: str
    semester: Optional[int] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    branch_id: Optional[str] = None
    semester: Optional[int] = None


class StudentResponse(StudentBase):
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Room Schemas
class RoomBase(BaseModel):
    id: str
    rows: int
    cols: int


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    rows: Optional[int] = None
    cols: Optional[int] = None


class RoomResponse(RoomBase):
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Subject Schemas
class SubjectBase(BaseModel):
    id: str
    name: str


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = None


class SubjectResponse(SubjectBase):
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Allocation Schemas
class AllocationRequest(BaseModel):
    branch1_id: str
    branch2_id: str
    room_id: str
    date: Optional[str] = None


# Seating Plan Schemas
class SeatingPlanBase(BaseModel):
    name: str
    exam_date: Optional[str] = None
    description: Optional[str] = None


class SeatingPlanCreate(SeatingPlanBase):
    allocation_data: Dict[str, Any]
    total_students: int
    total_rooms: int
    data_source: str = "existing"


class SeatingPlanUpdate(BaseModel):
    name: Optional[str] = None
    exam_date: Optional[str] = None
    description: Optional[str] = None


class SeatingPlanResponse(SeatingPlanBase):
    id: int
    allocation_data: Dict[str, Any]
    total_students: int
    total_rooms: int
    data_source: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SeatingPlanListResponse(BaseModel):
    id: int
    name: str
    exam_date: Optional[str] = None
    description: Optional[str] = None
    total_students: int
    total_rooms: int
    data_source: str
    created_at: datetime

    class Config:
        from_attributes = True


# Schemas for creating plans from existing data
class ExistingDataRequest(BaseModel):
    name: str
    exam_date: Optional[str] = None
    description: Optional[str] = None
    student_ids: List[str]
    room_ids: List[str]
    subject_ids: List[str]


# Schemas for import data
class ImportStudentData(BaseModel):
    roll_no: str
    branch: str
    subject: str


class ImportRoomData(BaseModel):
    room_id: str
    rows: int
    cols: int


class ImportDataRequest(BaseModel):
    name: str
    exam_date: Optional[str] = None
    description: Optional[str] = None
    students: List[ImportStudentData]
    rooms: List[ImportRoomData] 