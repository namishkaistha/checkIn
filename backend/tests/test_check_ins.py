"""Tests for /check-ins endpoints (POST, GET, POST .../approve)."""
from __future__ import annotations

from collections.abc import Generator
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.deps import _utc_now
from app.main import app


# ---------- helpers --------------------------------------------------------


def _create_user(client: TestClient, name: str, phone: str) -> dict:
    resp = client.post(
        "/users", json={"full_name": name, "phone_number": phone}
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.fixture
def freeze_time() -> Generator[callable, None, None]:
    """Override the ``_utc_now`` dependency for time-travel tests."""
    state: dict[str, datetime] = {"now": datetime.now(timezone.utc)}

    def _set(t: datetime) -> None:
        state["now"] = t

    app.dependency_overrides[_utc_now] = lambda: state["now"]
    try:
        yield _set
    finally:
        app.dependency_overrides.pop(_utc_now, None)


# ---------- POST /check-ins ------------------------------------------------


def test_post_happy_path_single_recipient(client: TestClient) -> None:
    user = _create_user(client, "Alice", "+13125551111")

    resp = client.post(
        "/check-ins",
        json={"picked_up_by_phone": "+13125551111", "also_for_phones": []},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()

    assert body["any_blocked"] is False
    assert isinstance(body["batch_id"], str) and body["batch_id"]
    assert len(body["rows"]) == 1
    row = body["rows"][0]
    assert row["user"]["id"] == user["id"]
    assert row["blocked"] is False
    assert row["last_check_in_at"] is None


def test_post_with_also_for_phones_creates_n_rows(client: TestClient) -> None:
    alice = _create_user(client, "Alice", "+13125551111")
    bob = _create_user(client, "Bob", "+13125552222")
    carol = _create_user(client, "Carol", "+13125553333")

    resp = client.post(
        "/check-ins",
        json={
            "picked_up_by_phone": "+13125551111",
            "also_for_phones": ["+13125552222", "+13125553333"],
        },
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()

    assert len(body["rows"]) == 3
    user_ids = [r["user"]["id"] for r in body["rows"]]
    assert user_ids == [alice["id"], bob["id"], carol["id"]]
    # batch_id is the recipient's row id; recipient is row index 0.
    assert isinstance(body["batch_id"], str)
    # And every row should report blocked=False on a clean DB.
    assert all(r["blocked"] is False for r in body["rows"])
    assert body["any_blocked"] is False


def test_post_dedupes_recipient_in_also_for_phones(client: TestClient) -> None:
    alice = _create_user(client, "Alice", "+13125551111")
    bob = _create_user(client, "Bob", "+13125552222")

    resp = client.post(
        "/check-ins",
        json={
            "picked_up_by_phone": "+13125551111",
            # Recipient self-included (in two formats); dedup to one row.
            "also_for_phones": ["(312) 555-1111", "+13125552222"],
        },
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    user_ids = [r["user"]["id"] for r in body["rows"]]
    assert user_ids == [alice["id"], bob["id"]]


def test_post_404_if_recipient_phone_unknown(client: TestClient) -> None:
    resp = client.post(
        "/check-ins",
        json={"picked_up_by_phone": "+13125559999", "also_for_phones": []},
    )
    assert resp.status_code == 404
    assert resp.json() == {"detail": "Recipient not registered"}


def test_post_404_if_also_for_phone_unknown_includes_phone(
    client: TestClient,
) -> None:
    _create_user(client, "Alice", "+13125551111")

    resp = client.post(
        "/check-ins",
        json={
            "picked_up_by_phone": "+13125551111",
            "also_for_phones": ["+13125558888"],
        },
    )
    assert resp.status_code == 404
    assert resp.json() == {"detail": "User not registered: +13125558888"}


def test_post_404_does_not_create_any_rows_on_unknown_dependent(
    client: TestClient, db_session,
) -> None:
    """No partial state when one of the also_for users is missing."""
    from app.models import CheckIn

    _create_user(client, "Alice", "+13125551111")

    resp = client.post(
        "/check-ins",
        json={
            "picked_up_by_phone": "+13125551111",
            "also_for_phones": ["+13125558888"],
        },
    )
    assert resp.status_code == 404
    assert db_session.query(CheckIn).count() == 0


def test_post_400_if_recipient_phone_invalid(client: TestClient) -> None:
    resp = client.post(
        "/check-ins",
        json={"picked_up_by_phone": "abc", "also_for_phones": []},
    )
    assert resp.status_code == 400
    assert resp.json() == {"detail": "Invalid phone number"}


def test_post_400_if_any_also_for_phone_invalid(client: TestClient) -> None:
    _create_user(client, "Alice", "+13125551111")

    resp = client.post(
        "/check-ins",
        json={
            "picked_up_by_phone": "+13125551111",
            "also_for_phones": ["abc"],
        },
    )
    assert resp.status_code == 400
    assert resp.json() == {"detail": "Invalid phone number"}


def test_post_partial_block_recent_approved(
    client: TestClient, db_session, freeze_time
) -> None:
    """Bob has an approved row 1 day ago; new batch flags him as blocked."""
    from app.models import CheckIn

    now = datetime.now(timezone.utc).replace(microsecond=0)
    freeze_time(now)

    alice = _create_user(client, "Alice", "+13125551111")
    bob = _create_user(client, "Bob", "+13125552222")

    # Insert prior approved for Bob, 1 day ago.
    prior = CheckIn(
        user_id=bob["id"],
        picked_up_by_user_id=bob["id"],
        status="approved",
        created_at=now - timedelta(days=1),
        approved_at=now - timedelta(days=1),
    )
    db_session.add(prior)
    db_session.commit()

    resp = client.post(
        "/check-ins",
        json={
            "picked_up_by_phone": "+13125551111",
            "also_for_phones": ["+13125552222"],
        },
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()

    rows_by_user = {r["user"]["id"]: r for r in body["rows"]}
    assert rows_by_user[alice["id"]]["blocked"] is False
    assert rows_by_user[bob["id"]]["blocked"] is True
    assert rows_by_user[bob["id"]]["last_check_in_at"] is not None
    assert body["any_blocked"] is True


def test_post_seven_day_boundary_does_not_block(
    client: TestClient, db_session, freeze_time
) -> None:
    """Prior approved exactly at now-7d sits just outside the strict window."""
    from app.models import CheckIn

    now = datetime.now(timezone.utc).replace(microsecond=0)
    freeze_time(now)

    alice = _create_user(client, "Alice", "+13125551111")
    prior = CheckIn(
        user_id=alice["id"],
        picked_up_by_user_id=alice["id"],
        status="approved",
        created_at=now - timedelta(days=7),
        approved_at=now - timedelta(days=7),
    )
    db_session.add(prior)
    db_session.commit()

    resp = client.post(
        "/check-ins",
        json={"picked_up_by_phone": "+13125551111", "also_for_phones": []},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["any_blocked"] is False
    assert body["rows"][0]["blocked"] is False


# ---------- POST /check-ins/{batch_id}/approve -----------------------------


def test_approve_happy_path(client: TestClient) -> None:
    _create_user(client, "Alice", "+13125551111")
    _create_user(client, "Bob", "+13125552222")

    create_resp = client.post(
        "/check-ins",
        json={
            "picked_up_by_phone": "+13125551111",
            "also_for_phones": ["+13125552222"],
        },
    )
    batch_id = create_resp.json()["batch_id"]

    approve_resp = client.post(
        f"/check-ins/{batch_id}/approve", json={"override": False}
    )
    assert approve_resp.status_code == 200, approve_resp.text
    body = approve_resp.json()
    assert body["batch_id"] == batch_id
    assert len(body["rows"]) == 2
    assert body["approved_at"] is not None


def test_approve_with_blocked_rows_no_override_returns_422(
    client: TestClient, db_session, freeze_time
) -> None:
    from app.models import CheckIn

    now = datetime.now(timezone.utc).replace(microsecond=0)
    freeze_time(now)

    _create_user(client, "Alice", "+13125551111")
    bob = _create_user(client, "Bob", "+13125552222")

    # Bob already approved 1 day ago.
    db_session.add(
        CheckIn(
            user_id=bob["id"],
            picked_up_by_user_id=bob["id"],
            status="approved",
            created_at=now - timedelta(days=1),
            approved_at=now - timedelta(days=1),
        )
    )
    db_session.commit()

    create_resp = client.post(
        "/check-ins",
        json={
            "picked_up_by_phone": "+13125551111",
            "also_for_phones": ["+13125552222"],
        },
    )
    batch_id = create_resp.json()["batch_id"]

    approve_resp = client.post(
        f"/check-ins/{batch_id}/approve", json={"override": False}
    )
    assert approve_resp.status_code == 422
    body = approve_resp.json()
    assert "Re-submit with override=true" in body["detail"]["message"]
    # Caller still gets row info so they can show which rows blocked.
    assert "rows" in body["detail"]
    assert any(r["blocked"] for r in body["detail"]["rows"])


def test_approve_with_blocked_rows_override_true_succeeds(
    client: TestClient, db_session, freeze_time
) -> None:
    from app.models import CheckIn

    now = datetime.now(timezone.utc).replace(microsecond=0)
    freeze_time(now)

    _create_user(client, "Alice", "+13125551111")
    bob = _create_user(client, "Bob", "+13125552222")

    db_session.add(
        CheckIn(
            user_id=bob["id"],
            picked_up_by_user_id=bob["id"],
            status="approved",
            created_at=now - timedelta(days=1),
            approved_at=now - timedelta(days=1),
        )
    )
    db_session.commit()

    create_resp = client.post(
        "/check-ins",
        json={
            "picked_up_by_phone": "+13125551111",
            "also_for_phones": ["+13125552222"],
        },
    )
    batch_id = create_resp.json()["batch_id"]

    approve_resp = client.post(
        f"/check-ins/{batch_id}/approve", json={"override": True}
    )
    assert approve_resp.status_code == 200, approve_resp.text
    body = approve_resp.json()
    assert body["approved_at"] is not None

    # Inspect DB: of the two batch rows (located by approved_at == now),
    # bob's row should have override=True, alice's should be False.
    db_session.expire_all()
    fresh_batch_rows = (
        db_session.query(CheckIn)
        .filter(CheckIn.approved_at == now, CheckIn.status == "approved")
        .all()
    )
    assert len(fresh_batch_rows) == 2
    overridden = [r for r in fresh_batch_rows if r.override is True]
    not_overridden = [r for r in fresh_batch_rows if r.override is False]
    assert len(overridden) == 1
    assert overridden[0].user_id == bob["id"]
    assert len(not_overridden) == 1


def test_approve_idempotent(client: TestClient) -> None:
    _create_user(client, "Alice", "+13125551111")

    create_resp = client.post(
        "/check-ins",
        json={"picked_up_by_phone": "+13125551111", "also_for_phones": []},
    )
    batch_id = create_resp.json()["batch_id"]

    first = client.post(
        f"/check-ins/{batch_id}/approve", json={"override": False}
    )
    assert first.status_code == 200
    first_at = first.json()["approved_at"]

    second = client.post(
        f"/check-ins/{batch_id}/approve", json={"override": False}
    )
    assert second.status_code == 200
    assert second.json()["approved_at"] == first_at


def test_approve_404_if_batch_id_unknown(client: TestClient) -> None:
    resp = client.post(
        "/check-ins/no-such-batch/approve", json={"override": False}
    )
    assert resp.status_code == 404


# ---------- GET /check-ins/{batch_id} --------------------------------------


def test_get_batch_returns_pending_state(client: TestClient) -> None:
    _create_user(client, "Alice", "+13125551111")
    create_resp = client.post(
        "/check-ins",
        json={"picked_up_by_phone": "+13125551111", "also_for_phones": []},
    )
    batch_id = create_resp.json()["batch_id"]

    resp = client.get(f"/check-ins/{batch_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["batch_id"] == batch_id
    assert "approved_at" not in body  # CheckInBatchOut shape, not Approved


def test_get_batch_returns_approved_state(client: TestClient) -> None:
    _create_user(client, "Alice", "+13125551111")
    create_resp = client.post(
        "/check-ins",
        json={"picked_up_by_phone": "+13125551111", "also_for_phones": []},
    )
    batch_id = create_resp.json()["batch_id"]

    client.post(f"/check-ins/{batch_id}/approve", json={"override": False})

    resp = client.get(f"/check-ins/{batch_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["batch_id"] == batch_id
    assert body["approved_at"] is not None


def test_get_batch_404_if_unknown(client: TestClient) -> None:
    resp = client.get("/check-ins/no-such-batch")
    assert resp.status_code == 404
