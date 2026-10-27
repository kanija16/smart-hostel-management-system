from app.routes.auth import router as auth_router
from app.routes.rooms import router as rooms_router
from app.routes.room_requests import router as room_requests_router
from app.routes.complaints import router as complaints_router
from app.routes.stats import router as stats_router

__all__ = [
    "auth_router",
    "rooms_router",
    "room_requests_router",
    "complaints_router",
    "stats_router"
]
