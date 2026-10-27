from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import Base, engine
from app.data.seed import seed_database
from app.services.classifier import classifier
from app.routes import (
    auth_router,
    rooms_router,
    room_requests_router,
    complaints_router,
    stats_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist, model is initialized, and sample data is seeded
    print(f"[{settings.PROJECT_NAME}] Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    print(f"[{settings.PROJECT_NAME}] Verifying AI classification model...")
    classifier._ensure_model_loaded()
    
    print(f"[{settings.PROJECT_NAME}] Checking seed data...")
    seed_database()
    
    print(f"[{settings.PROJECT_NAME}] Application startup complete.")
    yield
    print(f"[{settings.PROJECT_NAME}] Application shutdown.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smart Hostel Management System with AI-Based Complaint Classification and Prioritization API",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(rooms_router, prefix=settings.API_V1_STR)
app.include_router(room_requests_router, prefix=settings.API_V1_STR)
app.include_router(complaints_router, prefix=settings.API_V1_STR)
app.include_router(stats_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }
