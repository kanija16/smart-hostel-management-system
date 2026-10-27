import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.models.room import Room
from app.services.auth_service import get_password_hash, create_access_token
from app.services.classifier import classifier

# Use a dedicated test database
TEST_DB_FILE = "./test_hostel.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    # Ensure model is ready
    classifier._ensure_model_loaded()
    # Remove existing test DB if any
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass

    Base.metadata.create_all(bind=test_engine)
    yield
    # Cleanup after test suite
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass

@pytest.fixture(scope="function")
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed baseline users and rooms if empty
    if session.query(User).count() == 0:
        room1 = Room(room_number="T-101", block="Block T", floor=1, capacity=2, room_type="Double", status="Available", occupied_count=1)
        room2 = Room(room_number="T-102", block="Block T", floor=1, capacity=1, room_type="Single", status="Available", occupied_count=0)
        session.add_all([room1, room2])
        session.flush()

        admin = User(
            email="admin@test.com",
            password_hash=get_password_hash("Admin@123"),
            full_name="Test Admin",
            role=UserRole.ADMIN.value
        )
        warden = User(
            email="warden@test.com",
            password_hash=get_password_hash("Warden@123"),
            full_name="Test Warden",
            role=UserRole.WARDEN.value
        )
        student1 = User(
            email="student1@test.com",
            password_hash=get_password_hash("Student@123"),
            full_name="Student One",
            role=UserRole.STUDENT.value,
            student_id_number="TEST001",
            room_id=room1.id
        )
        student2 = User(
            email="student2@test.com",
            password_hash=get_password_hash("Student@123"),
            full_name="Student Two",
            role=UserRole.STUDENT.value,
            student_id_number="TEST002"
        )
        session.add_all([admin, warden, student1, student2])
        session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_headers(db):
    admin = db.query(User).filter(User.email == "admin@test.com").first()
    token = create_access_token({"sub": admin.email, "role": admin.role, "user_id": admin.id})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def warden_headers(db):
    warden = db.query(User).filter(User.email == "warden@test.com").first()
    token = create_access_token({"sub": warden.email, "role": warden.role, "user_id": warden.id})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def student1_headers(db):
    student1 = db.query(User).filter(User.email == "student1@test.com").first()
    token = create_access_token({"sub": student1.email, "role": student1.role, "user_id": student1.id})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def student2_headers(db):
    student2 = db.query(User).filter(User.email == "student2@test.com").first()
    token = create_access_token({"sub": student2.email, "role": student2.role, "user_id": student2.id})
    return {"Authorization": f"Bearer {token}"}
