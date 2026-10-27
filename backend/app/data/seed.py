"""Database Seeding Script for Smart Hostel Management System"""

import os
from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.models.user import User, UserRole
from app.models.room import Room
from app.models.room_request import RoomRequest
from app.models.complaint import Complaint
from app.services.auth_service import get_password_hash
from app.services.classifier import classifier

def seed_database():
    print("[Seed] Creating all tables...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("[Seed] Database already contains records. Skipping seed.")
            return

        print("[Seed] Seeding Rooms...")
        rooms_data = [
            # Block A
            {"room_number": "A-101", "block": "Block A", "floor": 1, "capacity": 2, "room_type": "Double", "status": "Available"},
            {"room_number": "A-102", "block": "Block A", "floor": 1, "capacity": 1, "room_type": "Single", "status": "Available"},
            {"room_number": "A-103", "block": "Block A", "floor": 1, "capacity": 2, "room_type": "Double", "status": "Available"},
            {"room_number": "A-201", "block": "Block A", "floor": 2, "capacity": 3, "room_type": "Triple", "status": "Available"},
            {"room_number": "A-202", "block": "Block A", "floor": 2, "capacity": 2, "room_type": "Double", "status": "Available"},
            # Block B
            {"room_number": "B-101", "block": "Block B", "floor": 1, "capacity": 2, "room_type": "Double", "status": "Available"},
            {"room_number": "B-102", "block": "Block B", "floor": 1, "capacity": 2, "room_type": "Double", "status": "Available"},
            {"room_number": "B-201", "block": "Block B", "floor": 2, "capacity": 1, "room_type": "Single", "status": "Available"},
            {"room_number": "B-202", "block": "Block B", "floor": 2, "capacity": 3, "room_type": "Triple", "status": "Available"},
            # Block C
            {"room_number": "C-101", "block": "Block C", "floor": 1, "capacity": 1, "room_type": "Single", "status": "Available"},
            {"room_number": "C-102", "block": "Block C", "floor": 1, "capacity": 2, "room_type": "Double", "status": "Available"},
            {"room_number": "C-103", "block": "Block C", "floor": 1, "capacity": 2, "room_type": "Double", "status": "Under Maintenance"},
        ]

        rooms_map = {}
        for r_info in rooms_data:
            room = Room(
                room_number=r_info["room_number"],
                block=r_info["block"],
                floor=r_info["floor"],
                capacity=r_info["capacity"],
                room_type=r_info["room_type"],
                status=r_info["status"],
                occupied_count=0
            )
            db.add(room)
            db.flush()
            rooms_map[room.room_number] = room

        print("[Seed] Seeding Users...")
        # 1. Admin
        admin = User(
            email="admin@hostel.com",
            password_hash=get_password_hash("Admin@123"),
            full_name="System Administrator",
            role=UserRole.ADMIN.value,
            contact_number="+1-555-0199"
        )
        db.add(admin)

        # 2. Warden
        warden = User(
            email="warden@hostel.com",
            password_hash=get_password_hash("Warden@123"),
            full_name="Dr. Robert Miller (Chief Warden)",
            role=UserRole.WARDEN.value,
            contact_number="+1-555-0144"
        )
        db.add(warden)

        # 3. Student 1 (Alex Johnson - Room A-101)
        student1 = User(
            email="student1@hostel.com",
            password_hash=get_password_hash("Student@123"),
            full_name="Alex Johnson",
            role=UserRole.STUDENT.value,
            student_id_number="STU2024001",
            contact_number="+1-555-0101",
            room_id=rooms_map["A-101"].id
        )
        rooms_map["A-101"].occupied_count += 1
        db.add(student1)

        # 4. Student 2 (Sarah Williams - Room B-101)
        student2 = User(
            email="student2@hostel.com",
            password_hash=get_password_hash("Student@123"),
            full_name="Sarah Williams",
            role=UserRole.STUDENT.value,
            student_id_number="STU2024002",
            contact_number="+1-555-0102",
            room_id=rooms_map["B-101"].id
        )
        rooms_map["B-101"].occupied_count += 1
        db.add(student2)

        # 5. Student 3 (David Lee - Unallocated)
        student3 = User(
            email="student3@hostel.com",
            password_hash=get_password_hash("Student@123"),
            full_name="David Lee",
            role=UserRole.STUDENT.value,
            student_id_number="STU2024003",
            contact_number="+1-555-0103",
            room_id=None
        )
        db.add(student3)
        db.flush()

        print("[Seed] Seeding Sample Complaints...")
        # Complaint 1: Plumbing (Alex Johnson)
        pred1 = classifier.predict(
            "Leaking bathroom faucet",
            "The tap in bathroom A-101 is leaking continuously, creating a water pool on the tiles."
        )
        comp1 = Complaint(
            student_id=student1.id,
            title="Leaking bathroom faucet",
            description="The tap in bathroom A-101 is leaking continuously, creating a water pool on the tiles.",
            room_number="A-101",
            predicted_category=pred1["predicted_category"],
            predicted_priority=pred1["predicted_priority"],
            confidence_score=pred1["confidence_score"],
            is_fallback=pred1["is_fallback"],
            final_category=pred1["predicted_category"],
            final_priority=pred1["predicted_priority"],
            status="Submitted"
        )
        db.add(comp1)

        # Complaint 2: Electrical Hazard (Alex Johnson)
        pred2 = classifier.predict(
            "Sparks from switchboard",
            "Electric switchboard sparked and smoke is coming out, dangerous burning smell near desk."
        )
        comp2 = Complaint(
            student_id=student1.id,
            title="Sparks from switchboard",
            description="Electric switchboard sparked and smoke is coming out, dangerous burning smell near desk.",
            room_number="A-101",
            predicted_category=pred2["predicted_category"],
            predicted_priority=pred2["predicted_priority"],
            confidence_score=pred2["confidence_score"],
            is_fallback=pred2["is_fallback"],
            final_category=pred2["predicted_category"],
            final_priority=pred2["predicted_priority"],
            status="In Progress",
            resolution_notes="Electrician dispatched to inspect main breaker and switchboard wiring.",
            assigned_warden_id=warden.id
        )
        db.add(comp2)

        # Complaint 3: Wi-Fi Down (Sarah Williams)
        pred3 = classifier.predict(
            "Wi-Fi connection down",
            "Wi-Fi in block B has been down for hours and cannot access university portal for quiz."
        )
        comp3 = Complaint(
            student_id=student2.id,
            title="Wi-Fi connection down",
            description="Wi-Fi in block B has been down for hours and cannot access university portal for quiz.",
            room_number="B-101",
            predicted_category=pred3["predicted_category"],
            predicted_priority=pred3["predicted_priority"],
            confidence_score=pred3["confidence_score"],
            is_fallback=pred3["is_fallback"],
            final_category=pred3["predicted_category"],
            final_priority=pred3["predicted_priority"],
            status="Resolved",
            resolution_notes="Network switch on 1st floor rebooted and AP re-authenticated successfully.",
            assigned_warden_id=warden.id
        )
        db.add(comp3)

        print("[Seed] Seeding Sample Room Request...")
        req1 = RoomRequest(
            student_id=student3.id,
            request_type="Allocation",
            preferred_room_type="Single",
            preferred_block="Block A",
            reason="Newly admitted postgraduate student requesting quiet single room accommodation for thesis research.",
            status="Pending"
        )
        db.add(req1)

        db.commit()
        print("[Seed] Seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
