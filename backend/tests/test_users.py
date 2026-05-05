"""Tests for POST /users and GET /users/lookup."""
from __future__ import annotations

from datetime import datetime, timedelta

from fastapi.testclient import TestClient


# ---------- POST /users ----------------------------------------------------


def test_post_users_creates_user_and_normalizes_phone(client: TestClient) -> None:
    resp = client.post(
        "/users",
        json={"full_name": "Ada Lovelace", "phone_number": "(312) 555-1234"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["full_name"] == "Ada Lovelace"
    assert body["phone_number"] == "+13125551234"
    assert isinstance(body["id"], str) and body["id"]
    assert isinstance(body["created_at"], str) and body["created_at"]
    parsed = datetime.fromisoformat(body["created_at"])
    assert parsed.tzinfo is not None, f"created_at should be tz-aware, got {body['created_at']!r}"
    assert parsed.utcoffset() == timedelta(0), (
        f"created_at should be UTC, got offset {parsed.utcoffset()!r}"
    )


def test_post_users_accepts_various_phone_formats(client: TestClient) -> None:
    resp = client.post(
        "/users",
        json={"full_name": "Grace Hopper", "phone_number": "312-555-9876"},
    )
    assert resp.status_code == 201
    assert resp.json()["phone_number"] == "+13125559876"


def test_post_users_invalid_phone_returns_400(client: TestClient) -> None:
    resp = client.post(
        "/users",
        json={"full_name": "Bad Phone", "phone_number": "abc"},
    )
    assert resp.status_code == 400
    assert resp.json() == {"detail": "Invalid phone number"}


def test_post_users_empty_phone_returns_400(client: TestClient) -> None:
    resp = client.post(
        "/users",
        json={"full_name": "Bad Phone", "phone_number": "   "},
    )
    assert resp.status_code == 400
    assert resp.json() == {"detail": "Invalid phone number"}


def test_post_users_duplicate_phone_returns_409(client: TestClient) -> None:
    payload = {"full_name": "Ada Lovelace", "phone_number": "(312) 555-1234"}
    first = client.post("/users", json=payload)
    assert first.status_code == 201

    # Same number expressed differently — must collide on normalized form.
    dup = client.post(
        "/users",
        json={"full_name": "Someone Else", "phone_number": "+1 312 555 1234"},
    )
    assert dup.status_code == 409
    assert dup.json() == {"detail": "User with this phone number already exists"}


# ---------- GET /users/lookup ----------------------------------------------


def test_get_users_lookup_finds_existing_user(client: TestClient) -> None:
    created = client.post(
        "/users",
        json={"full_name": "Ada Lovelace", "phone_number": "3125551234"},
    ).json()

    resp = client.get("/users/lookup", params={"phone": "(312) 555-1234"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == created["id"]
    assert body["full_name"] == "Ada Lovelace"
    assert body["phone_number"] == "+13125551234"


def test_get_users_lookup_normalizes_query(client: TestClient) -> None:
    client.post(
        "/users",
        json={"full_name": "Ada Lovelace", "phone_number": "+13125551234"},
    )
    # Wildly different format, same number.
    resp = client.get("/users/lookup", params={"phone": "  312-555-1234  "})
    assert resp.status_code == 200
    assert resp.json()["phone_number"] == "+13125551234"


def test_get_users_lookup_missing_returns_404(client: TestClient) -> None:
    resp = client.get("/users/lookup", params={"phone": "+13125550000"})
    assert resp.status_code == 404
    assert resp.json() == {"detail": "User not found"}


def test_get_users_lookup_invalid_phone_returns_400(client: TestClient) -> None:
    resp = client.get("/users/lookup", params={"phone": "abc"})
    assert resp.status_code == 400
    assert resp.json() == {"detail": "Invalid phone number"}


def test_get_users_lookup_empty_phone_returns_400(client: TestClient) -> None:
    resp = client.get("/users/lookup", params={"phone": "   "})
    assert resp.status_code == 400
    assert resp.json() == {"detail": "Invalid phone number"}
