from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    student_id_number: Optional[str] = None
    contact_number: Optional[str] = None
    room_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    contact_number: Optional[str] = None
    room_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    room_number: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
