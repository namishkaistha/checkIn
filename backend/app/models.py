"""SQLAlchemy ORM models — the persistence-layer schema.

Two tables: users and check_ins. There is deliberately **no** batches table;
a batch is expressed implicitly as the set of check_ins rows that share a
(picked_up_by_user_id, created_at) pair. See ``CheckIn`` below.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base, UtcDateTime


def _new_uuid() -> str:
    # Stored as a string because SQLite has no native UUID type. Portable to
    # Postgres later without a data migration — Postgres accepts str UUIDs.
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """A person known to the pantry, identified by their phone number.

    No auth, no email, no password. Phone number is the identity — normalized
    to E.164 at the HTTP boundary before it ever reaches this table, so the
    UNIQUE constraint below can be trusted to catch true duplicates.
    """

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    # UNIQUE + indexed: phone is the de-facto login. Lookups by phone are
    # the single hottest query in the app.
    phone_number: Mapped[str] = mapped_column(
        String, nullable=False, unique=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        UtcDateTime, nullable=False, default=_utcnow
    )


class CheckIn(Base):
    """One row per person in a check-in batch.

    The batch schema is the load-bearing design choice in this codebase.
    A "batch" of N people (recipient + household) is stored as N rows that
    share a single ``(picked_up_by_user_id, created_at)`` pair. That pair
    IS the batch identity — there is no separate batches table and no
    ``batch_id`` column. Sibling rows are found by the composite index.

    Why: one fewer table to keep in sync, no orphan-batch state, and the
    recipient's own row id doubles as the public ``batch_id`` exposed to
    the client.

    The ``override`` flag is a separate boolean rather than a fourth status
    (e.g. ``override_approved``). That keeps ``status`` a clean lifecycle
    column and turns "how many times did a volunteer bend the 7-day rule"
    into a plain ``WHERE override = true`` — a compliance-friendly query.
    """

    __tablename__ = "check_ins"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    # The person the bag is for.
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )
    # The person physically picking up (the recipient of the whole batch).
    # For a solo check-in, user_id == picked_up_by_user_id.
    picked_up_by_user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    # Set to True *at approve time* if this row would have been blocked by
    # the 7-day rule but the volunteer chose to override. Audit trail.
    override: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        UtcDateTime, nullable=False, default=_utcnow
    )
    approved_at: Mapped[datetime | None] = mapped_column(UtcDateTime, nullable=True)

    __table_args__ = (
        # ``cancelled`` is reserved for a future coordinator action; not
        # reachable from the current API surface. Cancelled rows do NOT
        # block future check-ins.
        CheckConstraint(
            "status IN ('pending', 'approved', 'cancelled')",
            name="ck_check_ins_status",
        ),
        # Powers the dedup query in services/dedup.py: for a given user_id,
        # find the most recent blocking row within the 7-day window.
        Index("ix_check_ins_user_id_created_at", "user_id", "created_at"),
        # Powers sibling lookup on approve: given a batch_id, find every
        # row sharing the same (picked_up_by_user_id, created_at) pair.
        # Without this index, approve would degrade to a full-table scan.
        Index(
            "ix_check_ins_picked_up_by_user_id_created_at",
            "picked_up_by_user_id",
            "created_at",
        ),
    )
