"""Database engine, the per-request session, and the UTC datetime column type."""

import sqlite3
from collections.abc import Iterator
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends
from sqlalchemy import DateTime, create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.types import TypeDecorator

from app.config import get_settings


class Base(DeclarativeBase):
    """Parent of every table class in models.py."""


class UTCDateTime(TypeDecorator):
    """SQLite forgets time zones, so store naive UTC and return aware UTC.

    That way the API always serializes timestamps with a trailing Z.
    """

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect) -> datetime | None:
        if value is not None and value.tzinfo is not None:
            value = value.astimezone(UTC).replace(tzinfo=None)
        return value

    def process_result_value(self, value: datetime | None, dialect) -> datetime | None:
        return value.replace(tzinfo=UTC) if value is not None else None


@event.listens_for(Engine, "connect")
def enable_foreign_keys(dbapi_connection, _record) -> None:
    """SQLite ignores foreign keys (and ON DELETE CASCADE) unless asked."""
    if isinstance(dbapi_connection, sqlite3.Connection):
        dbapi_connection.execute("PRAGMA foreign_keys=ON")


engine = create_engine(get_settings().database_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(engine, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """One session per request, closed when the response is sent."""
    with SessionLocal() as db:
        yield db


DbSession = Annotated[Session, Depends(get_db)]
