from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    room_number = Column(String(50), nullable=False)
    
    # AI Classification fields (Original prediction preserved)
    predicted_category = Column(String(50), nullable=False)
    predicted_priority = Column(String(50), nullable=False)
    confidence_score = Column(Float, nullable=False, default=0.0)
    is_fallback = Column(Boolean, default=False)
    
    # Final classification (can be updated/overridden by warden)
    final_category = Column(String(50), nullable=False)
    final_priority = Column(String(50), nullable=False)
    
    # Workflow status: Submitted, In Progress, Resolved, Rejected
    status = Column(String(50), default="Submitted", nullable=False)
    resolution_notes = Column(Text, nullable=True)
    assigned_warden_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="complaints")
    assigned_warden = relationship("User", foreign_keys=[assigned_warden_id])
