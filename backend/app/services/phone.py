"""Phone number normalization — single source of truth.

All phone numbers in the system are stored and compared in E.164 format.
Anything user-entered must pass through ``normalize_phone`` before it touches
the database or a query.
"""
from __future__ import annotations

import phonenumbers


class InvalidPhoneError(ValueError):
    """Raised when a phone string cannot be parsed into a valid E.164 number."""


_DEFAULT_REGION = "US"


def normalize_phone(raw: str) -> str:
    """Return ``raw`` formatted as an E.164 phone string (e.g. ``+13125551234``).

    Raises:
        InvalidPhoneError: if ``raw`` is empty, whitespace-only, unparseable,
            or does not represent a valid phone number.
    """
    if raw is None:
        raise InvalidPhoneError("phone number is required")

    stripped = raw.strip()
    if not stripped:
        raise InvalidPhoneError("phone number is required")

    try:
        parsed = phonenumbers.parse(stripped, _DEFAULT_REGION)
    except phonenumbers.NumberParseException as exc:
        raise InvalidPhoneError(str(exc)) from exc

    if not phonenumbers.is_valid_number(parsed):
        raise InvalidPhoneError("phone number is not valid")

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
