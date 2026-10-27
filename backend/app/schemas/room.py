from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class RoomBase(BaseModel):
    room_number: str = Field(..., min_length=1)
    block: str = Field(..., min_length=1)
    floor: int = Field(default=1, ge=0)
    capacity: int = Field(default=2, ge=1)
    room_type: str = Field(default="Double")  # Single, Double, Triple
    status: str = Field(default="Available")   # Available, Full, Under Maintenance

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    block: Optional[str] = None
    floor: Optional[int] = None
    capacity: Optional[int] = None
    room_type: Optional[str] = None
    status: Optional[str] = None

class RoomResponse(RoomBase):
    id: int
    occupied_count: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
