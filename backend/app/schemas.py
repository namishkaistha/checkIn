"""Pydantic request/response schemas — the HTTP-boundary contract.

These are the DTOs. They intentionally do NOT reuse SQLAlchemy models:
changing DB shape shouldn't ripple into the wire format, and changing the
wire format shouldn't ripple into the schema. ``from_attributes=True`` is
the only bridge between the two worlds.
"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    # No length cap here — the DB is the source of truth on that. We only
    # enforce "non-empty" at the wire.
    full_name: str = Field(min_length=1)
    phone_number: str = Field(min_length=1)


class UserOut(BaseModel):
    # from_attributes=True is what lets FastAPI serialize a SQLAlchemy
    # User instance directly by attribute access. Without it, we'd need
    # a manual dict conversion in every route.
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    phone_number: str
    created_at: datetime


# ---------- check-in schemas ----------------------------------------------


class CheckInRowOut(BaseModel):
    """A single recipient slice of a check-in batch.

    ``blocked``/``last_check_in_at`` are a *snapshot* of dedup state at the
    moment the batch was created (or, on approve responses, at the moment
    the approve check ran). GET /check-ins/{id} does NOT recompute — a
    stale row will read as blocked=False. Live re-evaluation would be
    misleading because the client already has a batch_id, meaning the
    creation-time decision already applied.
    """

    user: UserOut
    blocked: bool
    last_check_in_at: datetime | None


class CheckInBatchCreate(BaseModel):
    # Phones, not user IDs. The volunteer never sees IDs — the recipient
    # types their own phone number, and the server does the lookup. That
    # keeps the client dumb and the identity model consistent across
    # register / lookup / check-in.
    picked_up_by_phone: str
    also_for_phones: list[str] = []


class CheckInBatchOut(BaseModel):
    batch_id: str
    rows: list[CheckInRowOut]
    # Precomputed convenience so the client doesn't have to re-check by
    # iterating rows. Matches ``any(r.blocked for r in rows)``.
    any_blocked: bool


class CheckInApproveRequest(BaseModel):
    # Defaults to False — every override is an explicit, deliberate act.
    # The API rejects a blocked approve without this flag (HTTP 422), so
    # the volunteer has to consciously flip it in the UI before retrying.
    override: bool = False


class CheckInBatchApprovedOut(BaseModel):
    batch_id: str
    rows: list[CheckInRowOut]
    approved_at: datetime
