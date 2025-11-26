from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
from sqlalchemy.sql import func
from api.database import Base


class Class(Base):
    """Model for storing class/student data"""
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String, unique=True, index=True, nullable=False)
    total_students = Column(Integer, nullable=False)
    students = Column(JSON, nullable=False)  # Store student data as JSON
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Class(class_name={self.class_name}, total_students={self.total_students})>"


class Room(Base):
    """Model for storing room configuration data"""
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    room_name = Column(String, unique=True, index=True, nullable=False)
    rows = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False)
    total_capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Room(room_name={self.room_name}, capacity={self.total_capacity})>"

