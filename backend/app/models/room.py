from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String, unique=True, index=True, nullable=False)
    block = Column(String, nullable=False)
    floor = Column(Integer, default=1)
    capacity = Column(Integer, default=2)
    occupied_count = Column(Integer, default=0)
    room_type = Column(String, default="Double")  # Single, Double, Triple
    status = Column(String, default="Available")   # Available, Full, Under Maintenance
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    residents = relationship("User", back_populates="room")
