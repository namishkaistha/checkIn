"""Test fixtures: in-memory SQLite DB + FastAPI TestClient with dep override."""
from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Function-scoped in-memory SQLite session.

    A fresh schema is built for every test, so no state leaks between cases.
    StaticPool ensures the same in-memory DB is shared across connections
    within one test (sqlite normally gives each connection its own).
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """TestClient that routes ``get_db`` to the per-test in-memory session."""

    def _override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            # session lifecycle is owned by the db_session fixture
            pass

    app.dependency_overrides[get_db] = _override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)
