"""Tests for app.services.dedup.weekly_block_for.

The dedup service is the gatekeeper for the 7-day re-check rule. We test it
in isolation (no HTTP layer) so failures point at exactly the right code.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.orm import Session

from app.models import CheckIn, User
from app.services.dedup import weekly_block_for


# ---------- helpers --------------------------------------------------------


def _make_user(db: Session, name: str = "Test User", phone: str = "+13125551111") -> User:
    user = User(full_name=name, phone_number=phone)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _make_check_in(
    db: Session,
    *,
    user: User,
    picked_up_by: User,
    status: str,
    created_at: datetime,
    override: bool = False,
) -> CheckIn:
    row = CheckIn(
        user_id=user.id,
        picked_up_by_user_id=picked_up_by.id,
        status=status,
        override=override,
        created_at=created_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


# ---------- tests ----------------------------------------------------------


def test_no_prior_check_in_returns_none(db_session: Session) -> None:
    user = _make_user(db_session)
    now = datetime.now(timezone.utc)

    assert weekly_block_for(db_session, user.id, now) is None


def test_approved_six_days_ago_blocks(db_session: Session) -> None:
    user = _make_user(db_session)
    now = datetime.now(timezone.utc)
    row = _make_check_in(
        db_session,
        user=user,
        picked_up_by=user,
        status="approved",
        created_at=now - timedelta(days=6),
    )

    block = weekly_block_for(db_session, user.id, now)
    assert block is not None
    assert block.id == row.id


def test_approved_eight_days_ago_does_not_block(db_session: Session) -> None:
    user = _make_user(db_session)
    now = datetime.now(timezone.utc)
    _make_check_in(
        db_session,
        user=user,
        picked_up_by=user,
        status="approved",
        created_at=now - timedelta(days=8),
    )

    assert weekly_block_for(db_session, user.id, now) is None


def test_approved_exactly_seven_days_ago_does_not_block(db_session: Session) -> None:
    """Boundary case: window is strict `>`, so exactly 7d out is just outside."""
    user = _make_user(db_session)
    now = datetime.now(timezone.utc)
    _make_check_in(
        db_session,
        user=user,
        picked_up_by=user,
        status="approved",
        created_at=now - timedelta(days=7),
    )

    assert weekly_block_for(db_session, user.id, now) is None


def test_pending_one_day_ago_blocks(db_session: Session) -> None:
    """Pending blocks too — prevents double-submission across volunteers."""
    user = _make_user(db_session)
    now = datetime.now(timezone.utc)
    row = _make_check_in(
        db_session,
        user=user,
        picked_up_by=user,
        status="pending",
        created_at=now - timedelta(days=1),
    )

    block = weekly_block_for(db_session, user.id, now)
    assert block is not None
    assert block.id == row.id


def test_cancelled_one_day_ago_does_not_block(db_session: Session) -> None:
    user = _make_user(db_session)
    now = datetime.now(timezone.utc)
    _make_check_in(
        db_session,
        user=user,
        picked_up_by=user,
        status="cancelled",
        created_at=now - timedelta(days=1),
    )

    assert weekly_block_for(db_session, user.id, now) is None


def test_override_flagged_approved_still_blocks(db_session: Session) -> None:
    """override=True on a prior row does NOT exempt the next attempt."""
    user = _make_user(db_session)
    now = datetime.now(timezone.utc)
    row = _make_check_in(
        db_session,
        user=user,
        picked_up_by=user,
        status="approved",
        created_at=now - timedelta(days=1),
        override=True,
    )

    block = weekly_block_for(db_session, user.id, now)
    assert block is not None
    assert block.id == row.id


def test_returns_most_recent_blocking_row(db_session: Session) -> None:
    user = _make_user(db_session)
    now = datetime.now(timezone.utc)
    _make_check_in(
        db_session,
        user=user,
        picked_up_by=user,
        status="approved",
        created_at=now - timedelta(days=6),
    )
    newer = _make_check_in(
        db_session,
        user=user,
        picked_up_by=user,
        status="pending",
        created_at=now - timedelta(days=1),
    )
    _make_check_in(
        db_session,
        user=user,
        picked_up_by=user,
        status="approved",
        created_at=now - timedelta(days=3),
    )

    block = weekly_block_for(db_session, user.id, now)
    assert block is not None
    assert block.id == newer.id


def test_filters_by_user_id(db_session: Session) -> None:
    user_a = _make_user(db_session, name="Alice", phone="+13125551111")
    user_b = _make_user(db_session, name="Bob", phone="+13125552222")
    now = datetime.now(timezone.utc)
    # B has a recent approved row...
    _make_check_in(
        db_session,
        user=user_b,
        picked_up_by=user_b,
        status="approved",
        created_at=now - timedelta(days=1),
    )

    # ...but A is still clear.
    assert weekly_block_for(db_session, user_a.id, now) is None
