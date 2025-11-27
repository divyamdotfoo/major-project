from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from api.database import Base


class Branch(Base):
    """Model for storing branch/department data (CSE, ECE, etc.)"""
    __tablename__ = "branches"
    
    id = Column(String, primary_key=True, index=True)
    branch_name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to students
    students = relationship("Student", back_populates="branch", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Branch(branch_name={self.branch_name}, id={self.id})>"


class Student(Base):
    """Model for storing individual student data"""
    __tablename__ = "students"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    branch_id = Column(String, ForeignKey("branches.id"), nullable=False)
    semester = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to branch
    branch = relationship("Branch", back_populates="students")
    
    def __repr__(self):
        return f"<Student(id={self.id}, name={self.name})>"


class Room(Base):
    """Model for storing room configuration data"""
    __tablename__ = "rooms"
    
    id = Column(String, primary_key=True, index=True)
    rows = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Room(id={self.id}, rows={self.rows}, cols={self.cols})>"


class Subject(Base):
    """Model for storing subject data"""
    __tablename__ = "subjects"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Subject(id={self.id}, name={self.name})>"


class SeatingPlan(Base):
    """Model for storing exam seating allocation plans"""
    __tablename__ = "seating_plans"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    exam_date = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    
    # Store the allocation data as JSON
    allocation_data = Column(JSON, nullable=False)
    
    # Metadata about the plan
    total_students = Column(Integer, nullable=False, default=0)
    total_rooms = Column(Integer, nullable=False, default=0)
    
    # Track data source
    data_source = Column(String, nullable=False, default="existing")  # "existing" or "imported"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<SeatingPlan(id={self.id}, name={self.name})>"

