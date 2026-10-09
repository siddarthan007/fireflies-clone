"""Health check and the demo user. There is no login, so the user comes from configuration."""

from fastapi import APIRouter

from app.config import get_settings
from app.schemas import UserOut

router = APIRouter(tags=["system"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/me", response_model=UserOut)
def me() -> UserOut:
    settings = get_settings()
    return UserOut(name=settings.demo_user_name, email=settings.demo_user_email)
