from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class RoomRequest(Base):
    __tablename__ = "room_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    request_type = Column(String, default="Allocation")  # Allocation, Change
    preferred_room_type = Column(String, default="Double")  # Single, Double, Triple
    preferred_block = Column(String, nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(String, default="Pending")  # Pending, Approved, Rejected
    allocated_room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    admin_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="room_requests")
    allocated_room = relationship("Room", foreign_keys=[allocated_room_id])
