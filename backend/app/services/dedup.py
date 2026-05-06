"""Weekly dedup gatekeeper for check-ins.

A "block" is the most recent CheckIn row for ``user_id`` whose status is
``pending`` or ``approved`` and whose ``created_at`` is strictly within the
last 7 days. ``cancelled`` rows never block; the ``override`` flag does not
exempt the next attempt.

This module is a pure function of ``(session, user_id, now)`` so callers can
time-travel by passing a fixed ``now``. No I/O outside the session.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models import CheckIn

_WINDOW = timedelta(days=7)
_BLOCKING_STATUSES = ("pending", "approved")


def weekly_block_for(
    session: Session, user_id: str, now: datetime
) -> Optional[CheckIn]:
    """Return the most recent blocking CheckIn for ``user_id``, or None.

    A row blocks if:
        * ``user_id`` matches
        * ``status in ('pending', 'approved')``
        * ``created_at > now - 7 days`` (strict; equality does not block)
    """
    cutoff = now - _WINDOW
    return (
        session.query(CheckIn)
        .filter(
            CheckIn.user_id == user_id,
            CheckIn.status.in_(_BLOCKING_STATUSES),
            CheckIn.created_at > cutoff,
        )
        .order_by(CheckIn.created_at.desc())
        .first()
    )
