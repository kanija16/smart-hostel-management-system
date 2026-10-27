from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models.user import User, UserRole
from app.models.room import Room
from app.models.complaint import Complaint
from app.models.room_request import RoomRequest
from app.schemas.user import UserResponse
from app.services.auth_service import get_current_user, require_role, get_password_hash

router = APIRouter(prefix="/stats", tags=["Analytics & User Management"])

class DashboardStats(BaseModel):
    total_students: int
    total_wardens: int
    total_rooms: int
    total_capacity: int
    total_occupied: int
    occupancy_rate: float
    total_complaints: int
    active_complaints: int
    resolved_complaints: int
    rejected_complaints: int
    pending_room_requests: int
    complaints_by_category: dict
    complaints_by_priority: dict
    complaints_by_status: dict

class CreateUserAdminRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    student_id_number: Optional[str] = None
    contact_number: Optional[str] = None
    room_id: Optional[int] = None

class AssignRoomRequest(BaseModel):
    room_id: Optional[int] = None

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_students = db.query(User).filter(User.role == UserRole.STUDENT.value).count()
    total_wardens = db.query(User).filter(User.role == UserRole.WARDEN.value).count()
    total_rooms = db.query(Room).count()
    
    capacity_sum = db.query(func.sum(Room.capacity)).scalar() or 0
    occupied_sum = db.query(func.sum(Room.occupied_count)).scalar() or 0
    occupancy_rate = round((occupied_sum / capacity_sum * 100), 1) if capacity_sum > 0 else 0.0

    total_complaints = db.query(Complaint).count()
    active_complaints = db.query(Complaint).filter(Complaint.status.in_(["Submitted", "In Progress"])).count()
    resolved_complaints = db.query(Complaint).filter(Complaint.status == "Resolved").count()
    rejected_complaints = db.query(Complaint).filter(Complaint.status == "Rejected").count()
    pending_room_requests = db.query(RoomRequest).filter(RoomRequest.status == "Pending").count()

    # Category breakdown
    cat_counts = db.query(Complaint.final_category, func.count(Complaint.id)).group_by(Complaint.final_category).all()
    complaints_by_category = {cat: count for cat, count in cat_counts}

    # Priority breakdown
    prio_counts = db.query(Complaint.final_priority, func.count(Complaint.id)).group_by(Complaint.final_priority).all()
    complaints_by_priority = {prio: count for prio, count in prio_counts}

    # Status breakdown
    stat_counts = db.query(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status).all()
    complaints_by_status = {st: count for st, count in stat_counts}

    return {
        "total_students": total_students,
        "total_wardens": total_wardens,
        "total_rooms": total_rooms,
        "total_capacity": capacity_sum,
        "total_occupied": occupied_sum,
        "occupancy_rate": occupancy_rate,
        "total_complaints": total_complaints,
        "active_complaints": active_complaints,
        "resolved_complaints": resolved_complaints,
        "rejected_complaints": rejected_complaints,
        "pending_room_requests": pending_room_requests,
        "complaints_by_category": complaints_by_category,
        "complaints_by_priority": complaints_by_priority,
        "complaints_by_status": complaints_by_status
    }

@router.get("/users", response_model=List[UserResponse])
def list_users(
    role: Optional[str] = Query(None, description="Filter by role: student, warden, admin"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value, UserRole.WARDEN.value]))
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.order_by(User.full_name.asc()).all()
    
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "student_id_number": u.student_id_number,
            "contact_number": u.contact_number,
            "room_id": u.room_id,
            "room_number": u.room.room_number if u.room else None,
            "created_at": u.created_at
        })
    return result

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_by_admin(
    user_in: CreateUserAdminRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    if user_in.role not in [r.value for r in UserRole]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{user_in.role}'. Allowed: student, warden, admin"
        )

    # Validate room if provided
    if user_in.room_id:
        room = db.query(Room).filter(Room.id == user_in.room_id).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        if room.occupied_count >= room.capacity:
            raise HTTPException(status_code=400, detail="Room is already full")
        room.occupied_count += 1
        if room.occupied_count >= room.capacity:
            room.status = "Full"

    new_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        student_id_number=user_in.student_id_number,
        contact_number=user_in.contact_number,
        room_id=user_in.room_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role,
        "student_id_number": new_user.student_id_number,
        "contact_number": new_user.contact_number,
        "room_id": new_user.room_id,
        "room_number": new_user.room.room_number if new_user.room else None,
        "created_at": new_user.created_at
    }

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.room_id:
        room = db.query(Room).filter(Room.id == user.room_id).first()
        if room and room.occupied_count > 0:
            room.occupied_count -= 1
            if room.status == "Full":
                room.status = "Available"

    db.delete(user)
    db.commit()
    return None

@router.patch("/users/{user_id}/room", response_model=UserResponse)
def assign_user_room(
    user_id: int,
    assign_in: AssignRoomRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # If deallocating room
    if assign_in.room_id is None:
        if user.room_id:
            old_room = db.query(Room).filter(Room.id == user.room_id).first()
            if old_room and old_room.occupied_count > 0:
                old_room.occupied_count -= 1
                if old_room.status == "Full":
                    old_room.status = "Available"
            user.room_id = None
    else:
        new_room = db.query(Room).filter(Room.id == assign_in.room_id).first()
        if not new_room:
            raise HTTPException(status_code=404, detail="Target room not found")
        if user.room_id != new_room.id:
            if new_room.occupied_count >= new_room.capacity:
                raise HTTPException(status_code=400, detail="Target room is already full")
            if user.room_id:
                old_room = db.query(Room).filter(Room.id == user.room_id).first()
                if old_room and old_room.occupied_count > 0:
                    old_room.occupied_count -= 1
                    if old_room.status == "Full":
                        old_room.status = "Available"
            user.room_id = new_room.id
            new_room.occupied_count += 1
            if new_room.occupied_count >= new_room.capacity:
                new_room.status = "Full"

    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "student_id_number": user.student_id_number,
        "contact_number": user.contact_number,
        "room_id": user.room_id,
        "room_number": user.room.room_number if user.room else None,
        "created_at": user.created_at
    }
