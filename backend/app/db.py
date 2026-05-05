"""SQLAlchemy engine, session factory, declarative base, and FastAPI dep."""
from __future__ import annotations

from collections.abc import Generator
from datetime import datetime, timezone

from sqlalchemy import DateTime, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.types import TypeDecorator

# Dev DB. Tests override this via dependency_overrides on get_db, so this
# module-level engine is never actually touched during pytest.
DATABASE_URL = "sqlite:///./pantry.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
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
