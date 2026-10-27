"""Authentication and RBAC Tests"""

import pytest

def test_student_registration_success(client):
    response = client.post("/api/auth/register", json={
        "email": "newstudent@test.com",
        "password": "Password@123",
        "full_name": "New Student",
        "student_id_number": "STU999",
        "contact_number": "+1-555-9999"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newstudent@test.com"
    assert data["role"] == "student"
    assert "password_hash" not in data

def test_student_registration_duplicate_email(client):
    response = client.post("/api/auth/register", json={
        "email": "student1@test.com",
        "password": "Password@123",
        "full_name": "Duplicate Student"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()

def test_login_success(client):
    response = client.post("/api/auth/login", json={
        "email": "student1@test.com",
        "password": "Student@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "student"

def test_login_invalid_credentials(client):
    response = client.post("/api/auth/login", json={
        "email": "student1@test.com",
        "password": "WrongPassword"
    })
    assert response.status_code == 401

def test_get_current_user_profile(client, student1_headers):
    response = client.get("/api/auth/me", headers=student1_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "student1@test.com"
    assert data["role"] == "student"
    assert data["room_number"] == "T-101"
