"""Pydantic request/response schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    full_name: str = Field(min_length=1)
    phone_number: str = Field(min_length=1)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    phone_number: str
    created_at: datetime


# ---------- check-in schemas ----------------------------------------------


class CheckInRowOut(BaseModel):
    """A single recipient slice of a check-in batch.

    ``blocked``/``last_check_in_at`` reflect the dedup state at *batch creation
    time* (or, in approve responses, the original creation-time block state).
    """

    user: UserOut
    blocked: bool
    last_check_in_at: datetime | None


class CheckInBatchCreate(BaseModel):
    picked_up_by_phone: str
    also_for_phones: list[str] = []


class CheckInBatchOut(BaseModel):
    batch_id: str
    rows: list[CheckInRowOut]
    any_blocked: bool


class CheckInApproveRequest(BaseModel):
    override: bool = False


class CheckInBatchApprovedOut(BaseModel):
    batch_id: str
    rows: list[CheckInRowOut]
    approved_at: datetime
