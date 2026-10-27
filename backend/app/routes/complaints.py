from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from typing import List, Optional
from app.database import get_db
from app.models.complaint import Complaint
from app.models.user import User, UserRole
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintStatusUpdate,
    ComplaintClassificationOverride,
    ComplaintResponse,
    PredictionPreviewRequest,
    PredictionPreviewResponse,
    VALID_STATUSES
)
from app.services.auth_service import get_current_user, require_role
from app.services.classifier import classifier

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def format_complaint(c: Complaint) -> dict:
    return {
        "id": c.id,
        "student_id": c.student_id,
        "student_name": c.student.full_name if c.student else None,
        "student_email": c.student.email if c.student else None,
        "student_id_number": c.student.student_id_number if c.student else None,
        "title": c.title,
        "description": c.description,
        "room_number": c.room_number,
        "predicted_category": c.predicted_category,
        "predicted_priority": c.predicted_priority,
        "confidence_score": c.confidence_score,
        "is_fallback": c.is_fallback,
        "final_category": c.final_category,
        "final_priority": c.final_priority,
        "status": c.status,
        "resolution_notes": c.resolution_notes,
        "assigned_warden_id": c.assigned_warden_id,
        "assigned_warden_name": c.assigned_warden.full_name if c.assigned_warden else None,
        "created_at": c.created_at,
        "updated_at": c.updated_at
    }

@router.post("/preview", response_model=PredictionPreviewResponse)
def preview_prediction(
    request: PredictionPreviewRequest,
    current_user: User = Depends(get_current_user)
):
    """Real-time preview of AI classification and priority logic."""
    prediction = classifier.predict(request.title, request.description)
    return prediction

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(
    complaint_in: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT.value]))
):
    """
    Submits a new hostel complaint.
    Executes TF-IDF + Multinomial Naive Bayes classification and priority engine.
    Persists original prediction and sets initial final values.
    """
    # Run AI Classification & Priority Engine
    ai_result = classifier.predict(complaint_in.title, complaint_in.description)

    complaint = Complaint(
        student_id=current_user.id,
        title=complaint_in.title,
        description=complaint_in.description,
        room_number=complaint_in.room_number,
        predicted_category=ai_result["predicted_category"],
        predicted_priority=ai_result["predicted_priority"],
        confidence_score=ai_result["confidence_score"],
        is_fallback=ai_result["is_fallback"],
        final_category=ai_result["predicted_category"],
        final_priority=ai_result["predicted_priority"],
        status="Submitted"
    )

    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return format_complaint(complaint)

@router.get("", response_model=List[ComplaintResponse])
def get_complaints(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    room_number: Optional[str] = Query(None, description="Filter by room number"),
    sort_by_priority: bool = Query(True, description="Sort Critical > High > Medium > Low"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves complaints.
    Students can ONLY see their own complaints.
    Wardens and Admins can view and filter all complaints.
    """
    query = db.query(Complaint)

    if current_user.role == UserRole.STUDENT.value:
        query = query.filter(Complaint.student_id == current_user.id)
    
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if category:
        query = query.filter(Complaint.final_category == category)
    if priority:
        query = query.filter(Complaint.final_priority == priority)
    if room_number:
        query = query.filter(Complaint.room_number.ilike(f"%{room_number}%"))

    if sort_by_priority:
        # Order by priority weight: Critical (1) > High (2) > Medium (3) > Low (4)
        priority_order = case(
            (Complaint.final_priority == "Critical", 1),
            (Complaint.final_priority == "High", 2),
            (Complaint.final_priority == "Medium", 3),
            (Complaint.final_priority == "Low", 4),
            else_=5
        )
        query = query.order_by(priority_order.asc(), Complaint.created_at.desc())
    else:
        query = query.order_by(Complaint.created_at.desc())

    complaints = query.all()
    return [format_complaint(c) for c in complaints]

@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves complaint details.
    Enforces strict student access control: students cannot access other students' complaints.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with id {complaint_id} not found"
        )

    # Student access control
    if current_user.role == UserRole.STUDENT.value and complaint.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to view other students' complaints"
        )

    return format_complaint(complaint)

@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    update_in: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.WARDEN.value, UserRole.ADMIN.value]))
):
    """
    Updates the workflow status of a complaint.
    Restricted to Wardens and Admins.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with id {complaint_id} not found"
        )

    complaint.status = update_in.status
    if update_in.resolution_notes is not None:
        complaint.resolution_notes = update_in.resolution_notes
    if current_user.role == UserRole.WARDEN.value:
        complaint.assigned_warden_id = current_user.id

    db.commit()
    db.refresh(complaint)
    return format_complaint(complaint)

@router.patch("/{complaint_id}/override", response_model=ComplaintResponse)
def override_complaint_classification(
    complaint_id: int,
    override_in: ComplaintClassificationOverride,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.WARDEN.value, UserRole.ADMIN.value]))
):
    """
    Allows authorized Warden to correct AI classification.
    Preserves original predicted_category, predicted_priority, and confidence_score.
    Updates final_category and final_priority.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with id {complaint_id} not found"
        )

    complaint.final_category = override_in.final_category
    complaint.final_priority = override_in.final_priority
    if override_in.resolution_notes is not None:
        note = f"[Warden Classification Correction: {override_in.final_category}/{override_in.final_priority}] {override_in.resolution_notes}"
        complaint.resolution_notes = f"{complaint.resolution_notes}\n{note}" if complaint.resolution_notes else note

    db.commit()
    db.refresh(complaint)
    return format_complaint(complaint)
