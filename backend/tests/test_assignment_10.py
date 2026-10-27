"""Software Testing Assignment - 10 Core Automated Tests

1. Valid complaint submission
2. Empty complaint description rejection
3. Plumbing complaint classification
4. Urgent electrical complaint classification
5. Student access restrictions for other students' complaints
6. Warden complaint-status updates
7. Invalid complaint status rejection
8. Complaint persistence after application restart
9. Unknown complaint classification fallback
10. Unauthorized access to warden endpoints
"""

import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.complaint import Complaint
from app.models.user import User, UserRole
from app.services.auth_service import get_password_hash

# 1. Valid complaint submission
def test_valid_complaint_submission(client, student1_headers, db):
    payload = {
        "title": "Study table chair leg broken",
        "description": "The study chair has a broken leg and cannot be sat upon safely",
        "room_number": "T-101"
    }
    response = client.post("/api/complaints", json=payload, headers=student1_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["room_number"] == "T-101"
    assert data["status"] == "Submitted"
    assert data["predicted_category"] in ["Maintenance", "Other"]
    assert data["predicted_priority"] in ["Critical", "High", "Medium", "Low"]
    assert data["confidence_score"] >= 0.0

    # Verify DB persistence
    complaint_db = db.query(Complaint).filter(Complaint.id == data["id"]).first()
    assert complaint_db is not None
    assert complaint_db.title == payload["title"]

# 2. Empty complaint description rejection
def test_empty_complaint_description_rejection(client, student1_headers):
    # Test completely empty string
    response_empty = client.post("/api/complaints", json={
        "title": "Bathroom tap issue",
        "description": "",
        "room_number": "T-101"
    }, headers=student1_headers)
    assert response_empty.status_code == 422

    # Test whitespace-only string
    response_whitespace = client.post("/api/complaints", json={
        "title": "Bathroom tap issue",
        "description": "       ",
        "room_number": "T-101"
    }, headers=student1_headers)
    assert response_whitespace.status_code == 422

# 3. Plumbing complaint classification
def test_plumbing_complaint_classification(client, student1_headers):
    payload = {
        "title": "Severe bathroom pipe leakage",
        "description": "Water pipe leaking heavily under the bathroom sink, water overflowing onto floor",
        "room_number": "T-101"
    }
    response = client.post("/api/complaints", json=payload, headers=student1_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["predicted_category"] == "Plumbing"
    assert data["final_category"] == "Plumbing"
    assert data["is_fallback"] is False
    assert data["confidence_score"] > 0.5

# 4. Urgent electrical complaint classification
def test_urgent_electrical_complaint_classification(client, student1_headers):
    payload = {
        "title": "Switchboard emergency",
        "description": "Electric switchboard sparked and smoke is coming out, dangerous burning smell",
        "room_number": "T-101"
    }
    response = client.post("/api/complaints", json=payload, headers=student1_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["predicted_category"] == "Electrical"
    assert data["predicted_priority"] == "Critical"
    assert data["final_priority"] == "Critical"
    assert data["is_fallback"] is False

# 5. Student access restrictions for other students' complaints
def test_student_access_restrictions_for_other_students_complaints(client, student1_headers, student2_headers):
    # Student 1 creates a complaint
    post_res = client.post("/api/complaints", json={
        "title": "Alex Private Complaint",
        "description": "Shower head fell off and water is spraying uncontrollably",
        "room_number": "T-101"
    }, headers=student1_headers)
    assert post_res.status_code == 201
    complaint_id = post_res.json()["id"]

    # Student 1 can access it
    own_res = client.get(f"/api/complaints/{complaint_id}", headers=student1_headers)
    assert own_res.status_code == 200

    # Student 2 tries to access Student 1's complaint -> Forbidden (403)
    forbidden_res = client.get(f"/api/complaints/{complaint_id}", headers=student2_headers)
    assert forbidden_res.status_code == 403
    assert "access forbidden" in forbidden_res.json()["detail"].lower()

# 6. Warden complaint-status updates
def test_warden_complaint_status_updates(client, student1_headers, warden_headers):
    # Create complaint as student
    post_res = client.post("/api/complaints", json={
        "title": "Fan not working",
        "description": "Ceiling fan capacitor dead, fan turns very slowly even at max speed",
        "room_number": "T-101"
    }, headers=student1_headers)
    assert post_res.status_code == 201
    complaint_id = post_res.json()["id"]

    # Warden updates status to 'In Progress' with resolution notes
    patch_res = client.patch(f"/api/complaints/{complaint_id}/status", json={
        "status": "In Progress",
        "resolution_notes": "Maintenance team dispatched with replacement capacitor"
    }, headers=warden_headers)
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["status"] == "In Progress"
    assert "replacement capacitor" in updated_data["resolution_notes"]

    # Warden updates status to 'Resolved'
    resolved_res = client.patch(f"/api/complaints/{complaint_id}/status", json={
        "status": "Resolved",
        "resolution_notes": "Capacitor replaced and verified spinning at normal speed"
    }, headers=warden_headers)
    assert resolved_res.status_code == 200
    assert resolved_res.json()["status"] == "Resolved"

# 7. Invalid complaint status rejection
def test_invalid_complaint_status_rejection(client, student1_headers, warden_headers):
    post_res = client.post("/api/complaints", json={
        "title": "Wi-Fi issue",
        "description": "Extremely slow internet speeds making it impossible to download lecture slides",
        "room_number": "T-101"
    }, headers=student1_headers)
    assert post_res.status_code == 201
    complaint_id = post_res.json()["id"]

    # Attempt to set invalid status 'ArbitraryStatus'
    patch_res = client.patch(f"/api/complaints/{complaint_id}/status", json={
        "status": "ArbitraryStatus",
        "resolution_notes": "Should fail validation"
    }, headers=warden_headers)
    assert patch_res.status_code == 422

# 8. Complaint persistence after application restart
def test_complaint_persistence_after_application_restart():
    restart_db_file = "./restart_test.db"
    if os.path.exists(restart_db_file):
        os.remove(restart_db_file)

    restart_engine = create_engine(f"sqlite:///{restart_db_file}")
    Base.metadata.create_all(bind=restart_engine)
    RestartSession = sessionmaker(bind=restart_engine)

    # Step 1: Session 1 creates user and complaint
    session1 = RestartSession()
    user = User(
        email="restart_user@test.com",
        password_hash=get_password_hash("Pass@123"),
        full_name="Restart User",
        role=UserRole.STUDENT.value
    )
    session1.add(user)
    session1.flush()

    complaint = Complaint(
        student_id=user.id,
        title="Persistent Pipe Leak",
        description="Water pipe leaking heavily under the bathroom sink, water overflowing onto floor",
        room_number="R-101",
        predicted_category="Plumbing",
        predicted_priority="High",
        confidence_score=0.95,
        is_fallback=False,
        final_category="Plumbing",
        final_priority="High",
        status="Submitted"
    )
    session1.add(complaint)
    session1.commit()
    complaint_id = complaint.id

    # Simulate shutdown / application restart
    session1.close()
    restart_engine.dispose()

    # Step 2: Fresh restart - new engine and session pointing to the persisted SQLite file
    fresh_engine = create_engine(f"sqlite:///{restart_db_file}")
    FreshSession = sessionmaker(bind=fresh_engine)
    session2 = FreshSession()

    persisted_complaint = session2.query(Complaint).filter(Complaint.id == complaint_id).first()
    assert persisted_complaint is not None
    assert persisted_complaint.title == "Persistent Pipe Leak"
    assert persisted_complaint.predicted_category == "Plumbing"
    assert persisted_complaint.predicted_priority == "High"
    assert persisted_complaint.confidence_score == 0.95
    assert persisted_complaint.is_fallback is False
    assert persisted_complaint.status == "Submitted"

    session2.close()
    fresh_engine.dispose()
    if os.path.exists(restart_db_file):
        os.remove(restart_db_file)

# 9. Unknown complaint classification fallback
def test_unknown_complaint_classification_fallback(client, student1_headers):
    payload = {
        "title": "Random gibberish title",
        "description": "asdfghjk qwerty xyz123 nonesense blablabla",
        "room_number": "T-101"
    }
    response = client.post("/api/complaints", json=payload, headers=student1_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["predicted_category"] == "Other"
    assert data["is_fallback"] is True
    assert data["predicted_priority"] == "Low"

# 10. Unauthorized access to warden endpoints
def test_unauthorized_access_to_warden_endpoints(client, student1_headers):
    # Student 1 creates complaint
    post_res = client.post("/api/complaints", json={
        "title": "Corridor light fused",
        "description": "Main light bulb fused and room is completely in the dark",
        "room_number": "T-101"
    }, headers=student1_headers)
    assert post_res.status_code == 201
    complaint_id = post_res.json()["id"]

    # Student 1 tries to update status (warden endpoint) -> 403 Forbidden
    unauthorized_status = client.patch(
        f"/api/complaints/{complaint_id}/status",
        json={"status": "Resolved", "resolution_notes": "Student trying to resolve on own"},
        headers=student1_headers
    )
    assert unauthorized_status.status_code == 403
    assert "access denied" in unauthorized_status.json()["detail"].lower()

    # Student 1 tries to override classification (warden endpoint) -> 403 Forbidden
    unauthorized_override = client.patch(
        f"/api/complaints/{complaint_id}/override",
        json={"final_category": "Electrical", "final_priority": "Critical"},
        headers=student1_headers
    )
    assert unauthorized_override.status_code == 403
    assert "access denied" in unauthorized_override.json()["detail"].lower()
