from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime

VALID_CATEGORIES = [
    "Plumbing",
    "Electrical",
    "Cleaning",
    "Maintenance",
    "Internet",
    "Security",
    "Other"
]

VALID_PRIORITIES = [
    "Critical",
    "High",
    "Medium",
    "Low"
]

VALID_STATUSES = [
    "Submitted",
    "In Progress",
    "Resolved",
    "Rejected"
]

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, description="Short summary of issue")
    description: str = Field(..., min_length=1, description="Detailed complaint description")
    room_number: str = Field(..., min_length=1, max_length=50, description="Room where issue occurred")

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Complaint title cannot be empty or only whitespace")
        return v.strip()

    @field_validator("description")
    @classmethod
    def description_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Complaint description cannot be empty or only whitespace")
        return v.strip()

    @field_validator("room_number")
    @classmethod
    def room_number_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Room number cannot be empty or only whitespace")
        return v.strip()

class ComplaintStatusUpdate(BaseModel):
    status: str = Field(..., description="Complaint workflow status")
    resolution_notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"Invalid status '{v}'. Allowed statuses: {', '.join(VALID_STATUSES)}")
        return v

class ComplaintClassificationOverride(BaseModel):
    final_category: str = Field(..., description="Corrected category")
    final_priority: str = Field(..., description="Corrected priority")
    resolution_notes: Optional[str] = None

    @field_validator("final_category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"Invalid category '{v}'. Allowed categories: {', '.join(VALID_CATEGORIES)}")
        return v

    @field_validator("final_priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v not in VALID_PRIORITIES:
            raise ValueError(f"Invalid priority '{v}'. Allowed priorities: {', '.join(VALID_PRIORITIES)}")
        return v

class PredictionPreviewRequest(BaseModel):
    title: str = Field("", description="Complaint title")
    description: str = Field(..., min_length=1, description="Complaint text for real-time classification preview")

    @field_validator("description")
    @classmethod
    def description_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Description cannot be empty")
        return v.strip()

class PredictionPreviewResponse(BaseModel):
    predicted_category: str
    predicted_priority: str
    confidence_score: float
    is_fallback: bool
    priority_reason: str
    probabilities: Optional[dict] = None

class ComplaintResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    student_id_number: Optional[str] = None
    title: str
    description: str
    room_number: str
    predicted_category: str
    predicted_priority: str
    confidence_score: float
    is_fallback: bool
    final_category: str
    final_priority: str
    status: str
    resolution_notes: Optional[str] = None
    assigned_warden_id: Optional[int] = None
    assigned_warden_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
