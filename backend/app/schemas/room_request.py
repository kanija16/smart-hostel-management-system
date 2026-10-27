from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class RoomRequestCreate(BaseModel):
    request_type: str = Field(default="Allocation")  # Allocation, Change
    preferred_room_type: str = Field(default="Double")
    preferred_block: Optional[str] = None
    reason: str = Field(..., min_length=3)

class RoomRequestUpdate(BaseModel):
    status: str = Field(..., description="Approved or Rejected")
    allocated_room_id: Optional[int] = None
    admin_remarks: Optional[str] = None

class RoomRequestResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    current_room_number: Optional[str] = None
    request_type: str
    preferred_room_type: str
    preferred_block: Optional[str] = None
    reason: str
    status: str
    allocated_room_id: Optional[int] = None
    allocated_room_number: Optional[str] = None
    admin_remarks: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
