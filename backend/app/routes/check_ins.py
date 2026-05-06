"""Check-in batch endpoints: create, fetch, approve.

A "batch" is a set of CheckIn rows that share a single ``picked_up_by_user_id``
and a single ``created_at`` timestamp. The recipient's own row is created
first and its ``id`` is exposed as the public ``batch_id``. Sibling rows are
located via ``(picked_up_by_user_id, created_at)`` rather than a separate
``batch_id`` column to keep the schema minimal.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import _utc_now
from app.models import CheckIn, User
from app.schemas import (
    CheckInApproveRequest,
    CheckInBatchApprovedOut,
    CheckInBatchCreate,
    CheckInBatchOut,
    CheckInRowOut,
    UserOut,
)
from app.services.dedup import weekly_block_for
from app.services.phone import InvalidPhoneError, normalize_phone

router = APIRouter(prefix="/check-ins", tags=["check-ins"])


# ---------- helpers --------------------------------------------------------


def _normalize_or_400(raw: str) -> str:
    try:
        return normalize_phone(raw)
    except InvalidPhoneError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number",
        ) from exc


def _user_by_phone(db: Session, phone: str) -> Optional[User]:
    return db.query(User).filter(User.phone_number == phone).first()


def _row_out(
    *, user: User, block: Optional[CheckIn]
) -> CheckInRowOut:
    return CheckInRowOut(
        user=UserOut.model_validate(user),
        blocked=block is not None,
        last_check_in_at=block.created_at if block is not None else None,
    )


def _siblings_for_batch(db: Session, batch_id: str) -> tuple[CheckIn, list[CheckIn]]:
    """Return ``(recipient_row, all_batch_rows)`` for ``batch_id``.

    The recipient row is the one whose id == batch_id. Siblings share its
    ``picked_up_by_user_id`` and ``created_at``. Raises 404 if missing.
    """
    recipient = db.query(CheckIn).filter(CheckIn.id == batch_id).first()
    if recipient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found"
        )
    siblings = (
        db.query(CheckIn)
        .filter(
            CheckIn.picked_up_by_user_id == recipient.picked_up_by_user_id,
            CheckIn.created_at == recipient.created_at,
        )
        .all()
    )
    # Put recipient row first so client output ordering is stable.
    siblings.sort(key=lambda r: 0 if r.id == recipient.id else 1)
    return recipient, siblings


# ---------- POST /check-ins ------------------------------------------------


@router.post(
    "", response_model=CheckInBatchOut, status_code=status.HTTP_201_CREATED
)
def create_check_in_batch(
    payload: CheckInBatchCreate,
    db: Session = Depends(get_db),
    now: datetime = Depends(_utc_now),
) -> CheckInBatchOut:
    # 1. Recipient: normalize + lookup.
    recipient_phone = _normalize_or_400(payload.picked_up_by_phone)
    recipient = _user_by_phone(db, recipient_phone)
    if recipient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not registered",
        )

    # 2. Resolve every also_for phone before creating any rows.
    extra_users: list[User] = []
    for raw in payload.also_for_phones:
        phone = _normalize_or_400(raw)
        user = _user_by_phone(db, phone)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User not registered: {phone}",
            )
        extra_users.append(user)

    # 3. Dedup user_ids while preserving order; recipient first.
    user_id_order = list(
        dict.fromkeys([recipient.id, *(u.id for u in extra_users)])
    )
    users_by_id = {recipient.id: recipient, **{u.id: u for u in extra_users}}

    # 4. Compute blocking state per user.
    blocks: dict[str, Optional[CheckIn]] = {
        uid: weekly_block_for(db, uid, now) for uid in user_id_order
    }

    # 5. Create rows; recipient first so its id becomes batch_id. Share a
    # single ``created_at`` so siblings can be located by (picked_up_by, ts).
    rows: list[CheckIn] = []
    for uid in user_id_order:
        row = CheckIn(
            user_id=uid,
            picked_up_by_user_id=recipient.id,
            status="pending",
            created_at=now,
        )
        db.add(row)
        rows.append(row)
    db.commit()
    for row in rows:
        db.refresh(row)

    batch_id = rows[0].id
    out_rows = [
        _row_out(user=users_by_id[uid], block=blocks[uid]) for uid in user_id_order
    ]
    return CheckInBatchOut(
        batch_id=batch_id,
        rows=out_rows,
        any_blocked=any(r.blocked for r in out_rows),
    )


# ---------- POST /check-ins/{batch_id}/approve -----------------------------


@router.post(
    "/{batch_id}/approve",
    response_model=CheckInBatchApprovedOut,
    status_code=status.HTTP_200_OK,
)
def approve_check_in_batch(
    batch_id: str,
    payload: CheckInApproveRequest,
    db: Session = Depends(get_db),
    now: datetime = Depends(_utc_now),
) -> CheckInBatchApprovedOut:
    recipient_row, batch_rows = _siblings_for_batch(db, batch_id)
    batch_ids = [r.id for r in batch_rows]

    # Determine block state ignoring siblings in this batch — only OTHER
    # prior check-ins should block approval of this batch.
    cutoff = now - timedelta(days=7)

    def _block(user_id: str) -> Optional[CheckIn]:
        return (
            db.query(CheckIn)
            .filter(
                CheckIn.user_id == user_id,
                CheckIn.status.in_(("pending", "approved")),
                CheckIn.created_at > cutoff,
                ~CheckIn.id.in_(batch_ids),
            )
            .order_by(CheckIn.created_at.desc())
            .first()
        )

    user_ids = [r.user_id for r in batch_rows]
    users_by_id = {
        u.id: u
        for u in db.query(User).filter(User.id.in_(user_ids)).all()
    }
    blocks_by_user: dict[str, Optional[CheckIn]] = {
        r.user_id: _block(r.user_id) for r in batch_rows
    }
    out_rows = [
        _row_out(user=users_by_id[r.user_id], block=blocks_by_user[r.user_id])
        for r in batch_rows
    ]

    # Idempotency: already-approved batches return prior approved_at.
    if all(r.status == "approved" for r in batch_rows):
        return CheckInBatchApprovedOut(
            batch_id=batch_id,
            rows=out_rows,
            approved_at=recipient_row.approved_at,  # type: ignore[arg-type]
        )

    if any(out.blocked for out in out_rows) and not payload.override:
        raise HTTPException(
            status_code=422,
            detail={
                "message": (
                    "One or more recipients are within the 7-day window. "
                    "Re-submit with override=true to approve."
                ),
                "rows": [r.model_dump(mode="json") for r in out_rows],
            },
        )

    # Approve: stamp every row, mark override on originally-blocked rows.
    for r in batch_rows:
        r.status = "approved"
        r.approved_at = now
        if payload.override and blocks_by_user[r.user_id] is not None:
            r.override = True
    db.commit()
    for r in batch_rows:
        db.refresh(r)

    return CheckInBatchApprovedOut(
        batch_id=batch_id,
        rows=out_rows,
        approved_at=now,
    )


# ---------- GET /check-ins/{batch_id} --------------------------------------


@router.get("/{batch_id}")
def get_check_in_batch(
    batch_id: str, db: Session = Depends(get_db)
) -> dict:
    recipient_row, batch_rows = _siblings_for_batch(db, batch_id)
    user_ids = [r.user_id for r in batch_rows]
    users_by_id = {
        u.id: u
        for u in db.query(User).filter(User.id.in_(user_ids)).all()
    }
    # No live dedup recompute on GET — show the row's persisted state. We
    # still use _row_out so the response shape stays uniform; blocked is False
    # because we don't have a creation-time snapshot stored.
    out_rows = [
        _row_out(user=users_by_id[r.user_id], block=None) for r in batch_rows
    ]

    if all(r.status == "approved" for r in batch_rows):
        return CheckInBatchApprovedOut(
            batch_id=batch_id,
            rows=out_rows,
            approved_at=recipient_row.approved_at,  # type: ignore[arg-type]
        ).model_dump(mode="json")

    return CheckInBatchOut(
        batch_id=batch_id,
        rows=out_rows,
        any_blocked=False,
    ).model_dump(mode="json")
