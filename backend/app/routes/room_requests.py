from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.room_request import RoomRequest
from app.models.room import Room
from app.models.user import User, UserRole
from app.schemas.room_request import RoomRequestCreate, RoomRequestUpdate, RoomRequestResponse
from app.services.auth_service import get_current_user, require_role

router = APIRouter(prefix="/room-requests", tags=["Room Requests"])

def format_request_response(req: RoomRequest) -> dict:
    return {
        "id": req.id,
        "student_id": req.student_id,
        "student_name": req.student.full_name if req.student else None,
        "student_email": req.student.email if req.student else None,
        "current_room_number": req.student.room.room_number if req.student and req.student.room else None,
        "request_type": req.request_type,
        "preferred_room_type": req.preferred_room_type,
        "preferred_block": req.preferred_block,
        "reason": req.reason,
        "status": req.status,
        "allocated_room_id": req.allocated_room_id,
        "allocated_room_number": req.allocated_room.room_number if req.allocated_room else None,
        "admin_remarks": req.admin_remarks,
        "created_at": req.created_at,
        "updated_at": req.updated_at
    }

@router.post("", response_model=RoomRequestResponse, status_code=status.HTTP_201_CREATED)
def submit_room_request(
    request_in: RoomRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STUDENT.value]))
):
    # Check if student already has a pending request
    pending = db.query(RoomRequest).filter(
        RoomRequest.student_id == current_user.id,
        RoomRequest.status == "Pending"
    ).first()
    if pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active pending room request. Please wait for admin review."
        )

    req = RoomRequest(
        student_id=current_user.id,
        request_type=request_in.request_type,
        preferred_room_type=request_in.preferred_room_type,
        preferred_block=request_in.preferred_block,
        reason=request_in.reason,
        status="Pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return format_request_response(req)

@router.get("", response_model=List[RoomRequestResponse])
def get_room_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.STUDENT.value:
        requests = db.query(RoomRequest).filter(
            RoomRequest.student_id == current_user.id
        ).order_by(RoomRequest.created_at.desc()).all()
    else:
        # Admin or Warden can see all requests
        requests = db.query(RoomRequest).order_by(RoomRequest.created_at.desc()).all()

    return [format_request_response(r) for r in requests]

@router.patch("/{request_id}", response_model=RoomRequestResponse)
def update_room_request_status(
    request_id: int,
    request_update: RoomRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    req = db.query(RoomRequest).filter(RoomRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room request with id {request_id} not found"
        )

    if request_update.status not in ["Approved", "Rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be either 'Approved' or 'Rejected'"
        )

    student = db.query(User).filter(User.id == req.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student associated with this request was not found"
        )

    if request_update.status == "Approved":
        if not request_update.allocated_room_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="allocated_room_id is required when approving a room request"
            )

        new_room = db.query(Room).filter(Room.id == request_update.allocated_room_id).first()
        if not new_room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Room with id {request_update.allocated_room_id} not found"
            )

        if new_room.occupied_count >= new_room.capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Room {new_room.room_number} is already fully occupied ({new_room.occupied_count}/{new_room.capacity})"
            )

        # If student already had a room, decrement old room's count
        if student.room_id and student.room_id != new_room.id:
            old_room = db.query(Room).filter(Room.id == student.room_id).first()
            if old_room and old_room.occupied_count > 0:
                old_room.occupied_count -= 1
                if old_room.status == "Full":
                    old_room.status = "Available"

        # Allocate new room
        student.room_id = new_room.id
        new_room.occupied_count += 1
        if new_room.occupied_count >= new_room.capacity:
            new_room.status = "Full"

        req.allocated_room_id = new_room.id

    req.status = request_update.status
    if request_update.admin_remarks is not None:
        req.admin_remarks = request_update.admin_remarks

    db.commit()
    db.refresh(req)
    return format_request_response(req)
