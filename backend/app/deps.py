"""Shared FastAPI dependencies.

The single function here exists so tests can override `now` via
``app.dependency_overrides[_utc_now]`` and time-travel without monkey-patching
``datetime``.
"""
from __future__ import annotations

from datetime import datetime, timezone


def _utc_now() -> datetime:
    """Return the current UTC time. Override in tests for deterministic clocks."""
    return datetime.now(timezone.utc)
