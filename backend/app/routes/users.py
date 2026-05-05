"""User endpoints: create + lookup by phone."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.schemas import UserCreate, UserOut
from app.services.phone import InvalidPhoneError, normalize_phone

router = APIRouter(prefix="/users", tags=["users"])


def _normalize_or_400(raw: str) -> str:
    try:
        return normalize_phone(raw)
    except InvalidPhoneError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number",
        ) from exc


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    phone = _normalize_or_400(payload.phone_number)

    existing = db.query(User).filter(User.phone_number == phone).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this phone number already exists",
        )

    user = User(full_name=payload.full_name, phone_number=phone)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/lookup", response_model=UserOut)
def lookup_user(
    phone: str = Query(..., description="Phone number in any common format"),
    db: Session = Depends(get_db),
) -> User:
    normalized = _normalize_or_400(phone)
    user = db.query(User).filter(User.phone_number == normalized).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user
