"""The FastAPI application."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers import action_items, askfred, meetings, search, segments, system
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Seed a new database once. An intentionally emptied library stays empty."""
    if engine.url.database:  # SQLite file: make sure its folder exists
        Path(engine.url.database).parent.mkdir(parents=True, exist_ok=True)
    fresh_database = not inspect(engine).has_table("meetings")
    Base.metadata.create_all(engine)
    if fresh_database:
        with SessionLocal() as db:
            seed_if_empty(db)
    yield


app = FastAPI(title="Fireflies Clone API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (meetings, segments, action_items, askfred, search, system):
    app.include_router(module.router, prefix="/api/v1")
