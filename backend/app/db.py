"""SQLAlchemy engine, session factory, declarative base, and FastAPI dep."""
from __future__ import annotations

import os
from collections.abc import Generator
from datetime import datetime, timezone

from sqlalchemy import DateTime, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.types import TypeDecorator

# Prod uses Neon Postgres via the pooled endpoint (host ends in `-pooler`).
# Local dev falls back to a SQLite file. Tests override get_db entirely.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./pantry.db")

_is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    # pool_pre_ping guards against stale connections when Neon compute
    # suspends (scale-to-zero) between requests.
    pool_pre_ping=not _is_sqlite,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Project-wide declarative base."""


class UtcDateTime(TypeDecorator):
    """DateTime that round-trips as tz-aware UTC, even on SQLite.

    SQLite's SQLAlchemy dialect strips tzinfo on load regardless of
    DateTime(timezone=True). We normalize inbound values to naive UTC
    for storage, and re-attach timezone.utc on the way out so every
    Python-side consumer sees an aware datetime.
    """

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            return value
        return value.astimezone(timezone.utc).replace(tzinfo=None)

    def process_result_value(self, value: datetime | None, dialect):
        if value is None:
            return None
        return value.replace(tzinfo=timezone.utc)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a request-scoped Session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
