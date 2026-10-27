from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    STUDENT = "student"
    WARDEN = "warden"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default=UserRole.STUDENT.value, nullable=False)
    student_id_number = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    room = relationship("Room", back_populates="residents")
    complaints = relationship(
        "Complaint",
        back_populates="student",
        cascade="all, delete-orphan",
        foreign_keys="[Complaint.student_id]"
    )
    room_requests = relationship(
        "RoomRequest",
        back_populates="student",
        cascade="all, delete-orphan",
        foreign_keys="[RoomRequest.student_id]"
    )
