"""Tests for app.services.phone.normalize_phone."""
import pytest

from app.services.phone import InvalidPhoneError, normalize_phone


@pytest.mark.parametrize(
    "raw",
    [
        "(312) 555-1234",
        "312-555-1234",
        "3125551234",
        "+13125551234",
        "+1 312 555 1234",
        "  (312) 555-1234  ",
    ],
)
def test_normalize_phone_returns_e164(raw: str) -> None:
    assert normalize_phone(raw) == "+13125551234"


@pytest.mark.parametrize(
    "raw",
    [
        "",
        "   ",
        "abc",
        "123",
    ],
)
def test_normalize_phone_raises_for_invalid(raw: str) -> None:
    with pytest.raises(InvalidPhoneError):
        normalize_phone(raw)


def test_invalid_phone_error_is_value_error_subclass() -> None:
    # Convenience: makes it natural to catch as ValueError too if needed.
    assert issubclass(InvalidPhoneError, ValueError)
