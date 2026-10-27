"""Complete Full-Stack End-to-End Workflow Test

Validates the full interconnected lifecycle:
1. Student registers and logs in
2. Student views available rooms and submits room allocation request
3. Student submits plumbing complaint -> AI assigns Plumbing, High confidence
4. Student submits urgent electrical fire hazard -> AI assigns Electrical, Critical
5. Student submits ambiguous text -> Fallback triggers: Other, Low
6. Warden logs in and retrieves priority-sorted complaint list
7. Warden updates status of electrical complaint to 'In Progress' with notes
8. Warden overrides classification of plumbing complaint
9. Admin logs in and checks dashboard KPI stats
10. Admin approves student's pending room allocation request
11. Verifies student room occupancy update and room request completion
"""

import pytest

def test_full_system_e2e_journey(client):
    # --- STEP 1: Student Registration & Login ---
    reg_res = client.post("/api/auth/register", json={
        "email": "e2e_student@hostel.com",
        "password": "SecurePassword@123",
        "full_name": "E2E Test Student",
        "student_id_number": "STU2024E2E",
        "contact_number": "+1-555-8888"
    })
    assert reg_res.status_code == 201
    student_id = reg_res.json()["id"]

    login_res = client.post("/api/auth/login", json={
        "email": "e2e_student@hostel.com",
        "password": "SecurePassword@123"
    })
    assert login_res.status_code == 200
    student_token = login_res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Verify initial profile (unallocated)
    me_res = client.get("/api/auth/me", headers=student_headers)
    assert me_res.status_code == 200
    assert me_res.json()["room_id"] is None

    # --- STEP 2: View Available Rooms & Submit Room Request ---
    avail_rooms_res = client.get("/api/rooms/available", headers=student_headers)
    assert avail_rooms_res.status_code == 200
    available_rooms = avail_rooms_res.data if hasattr(avail_rooms_res, 'data') else avail_rooms_res.json()
    assert len(available_rooms) > 0
    target_room = available_rooms[0]

    room_req_res = client.post("/api/room-requests", json={
        "request_type": "Allocation",
        "preferred_room_type": target_room["room_type"],
        "preferred_block": target_room["block"],
        "reason": "First-year engineering resident requiring hostel room."
    }, headers=student_headers)
    assert room_req_res.status_code == 201
    room_request_id = room_req_res.json()["id"]
    assert room_req_res.json()["status"] == "Pending"

    # --- STEP 3: Submit Plumbing Complaint ---
    plumbing_res = client.post("/api/complaints", json={
        "title": "Severe bathroom leak",
        "description": "The washbasin drain is clogged and water is not draining away, overflowing onto floor",
        "room_number": target_room["room_number"]
    }, headers=student_headers)
    assert plumbing_res.status_code == 201
    plumbing_data = plumbing_res.json()
    assert plumbing_data["predicted_category"] == "Plumbing"
    assert plumbing_data["status"] == "Submitted"
    plumbing_id = plumbing_data["id"]

    # --- STEP 4: Submit Urgent Electrical Complaint ---
    electrical_res = client.post("/api/complaints", json={
        "title": "Switchboard fire risk",
        "description": "Electric switchboard sparked and smoke is coming out, dangerous burning smell",
        "room_number": target_room["room_number"]
    }, headers=student_headers)
    assert electrical_res.status_code == 201
    electrical_data = electrical_res.json()
    assert electrical_data["predicted_category"] == "Electrical"
    assert electrical_data["predicted_priority"] == "Critical"
    electrical_id = electrical_data["id"]

    # --- STEP 5: Submit Ambiguous / Fallback Complaint ---
    fallback_res = client.post("/api/complaints", json={
        "title": "Random query",
        "description": "asdfghjk qwerty zzz123 999xyz completely unknown words",
        "room_number": target_room["room_number"]
    }, headers=student_headers)
    assert fallback_res.status_code == 201
    fallback_data = fallback_res.json()
    assert fallback_data["predicted_category"] == "Other"
    assert fallback_data["is_fallback"] is True
    assert fallback_data["predicted_priority"] == "Low"

    # --- STEP 6: Warden Login & Priority Sorting ---
    warden_login_res = client.post("/api/auth/login", json={
        "email": "warden@test.com",
        "password": "Warden@123"
    })
    assert warden_login_res.status_code == 200
    warden_token = warden_login_res.json()["access_token"]
    warden_headers = {"Authorization": f"Bearer {warden_token}"}

    # Fetch complaints sorted by priority
    feed_res = client.get("/api/complaints?sort_by_priority=true", headers=warden_headers)
    assert feed_res.status_code == 200
    feed = feed_res.json()
    assert len(feed) >= 3
    # Top item should be Critical priority
    assert feed[0]["final_priority"] == "Critical"

    # --- STEP 7: Warden Updates Electrical Complaint Status ---
    update_res = client.patch(f"/api/complaints/{electrical_id}/status", json={
        "status": "In Progress",
        "resolution_notes": "Emergency electrical contractor dispatched with spare fuse and breaker."
    }, headers=warden_headers)
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "In Progress"
    assert "contractor dispatched" in update_res.json()["resolution_notes"]

    # --- STEP 8: Warden Overrides Plumbing Classification ---
    override_res = client.patch(f"/api/complaints/{plumbing_id}/override", json={
        "final_category": "Plumbing",
        "final_priority": "High",
        "resolution_notes": "Elevated to High priority due to water accumulation risk."
    }, headers=warden_headers)
    assert override_res.status_code == 200
    assert override_res.json()["final_priority"] == "High"

    # --- STEP 9: Admin Login & System Overview ---
    admin_login_res = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "Admin@123"
    })
    assert admin_login_res.status_code == 200
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    dashboard_res = client.get("/api/stats/dashboard", headers=admin_headers)
    assert dashboard_res.status_code == 200
    stats = dashboard_res.json()
    assert stats["total_students"] >= 1
    assert stats["total_complaints"] >= 3
    assert stats["pending_room_requests"] >= 1

    # --- STEP 10: Admin Approves Room Request ---
    approve_res = client.patch(f"/api/room-requests/{room_request_id}", json={
        "status": "Approved",
        "allocated_room_id": target_room["id"],
        "admin_remarks": "Room allotted as per vacancy."
    }, headers=admin_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "Approved"
    assert approve_res.json()["allocated_room_id"] == target_room["id"]

    # --- STEP 11: Verify Student Room is Updated ---
    student_profile = client.get("/api/auth/me", headers=student_headers).json()
    assert student_profile["room_id"] == target_room["id"]
    assert student_profile["room_number"] == target_room["room_number"]

    # --- STEP 12: Warden Resolves Complaint ---
    resolve_res = client.patch(f"/api/complaints/{electrical_id}/status", json={
        "status": "Resolved",
        "resolution_notes": "Switchboard replaced and load tested successfully."
    }, headers=warden_headers)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "Resolved"
