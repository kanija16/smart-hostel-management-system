from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.room import Room
from app.models.user import User, UserRole
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse
from app.services.auth_service import get_current_user, require_role

router = APIRouter(prefix="/rooms", tags=["Rooms"])

@router.get("", response_model=List[RoomResponse])
def get_rooms(
    block: Optional[str] = Query(None, description="Filter by block (e.g., 'Block A')"),
    room_type: Optional[str] = Query(None, description="Filter by type (Single, Double, Triple)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (Available, Full, Under Maintenance)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Room)
    if block:
        query = query.filter(Room.block == block)
    if room_type:
        query = query.filter(Room.room_type == room_type)
    if status_filter:
        query = query.filter(Room.status == status_filter)
    return query.order_by(Room.room_number.asc()).all()

@router.get("/available", response_model=List[RoomResponse])
def get_available_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rooms = db.query(Room).filter(
        Room.status == "Available",
        Room.occupied_count < Room.capacity
    ).order_by(Room.room_number.asc()).all()
    return rooms

@router.get("/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with id {room_id} not found"
        )
    return room

@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    room_in: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    existing = db.query(Room).filter(Room.room_number == room_in.room_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Room with number {room_in.room_number} already exists"
        )
    room = Room(
        room_number=room_in.room_number,
        block=room_in.block,
        floor=room_in.floor,
        capacity=room_in.capacity,
        room_type=room_in.room_type,
        status=room_in.status,
        occupied_count=0
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: int,
    room_in: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with id {room_id} not found"
        )

    if room_in.room_number and room_in.room_number != room.room_number:
        existing = db.query(Room).filter(Room.room_number == room_in.room_number).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Room number {room_in.room_number} is already in use"
            )
        room.room_number = room_in.room_number

    if room_in.block is not None:
        room.block = room_in.block
    if room_in.floor is not None:
        room.floor = room_in.floor
    if room_in.capacity is not None:
        if room_in.capacity < room.occupied_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reduce capacity to {room_in.capacity} when {room.occupied_count} residents are currently occupying it"
            )
        room.capacity = room_in.capacity
        if room.occupied_count >= room.capacity:
            room.status = "Full"
        elif room.status == "Full":
            room.status = "Available"
    if room_in.room_type is not None:
        room.room_type = room_in.room_type
    if room_in.status is not None:
        room.status = room_in.status

    db.commit()
    db.refresh(room)
    return room

@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with id {room_id} not found"
        )
    if room.occupied_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete room that currently has residents allocated"
        )
    db.delete(room)
    db.commit()
    return None
