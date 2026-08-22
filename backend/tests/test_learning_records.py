from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

import main
from learning_record_service import LearningRecordService

client = TestClient(main.app)


@pytest.fixture(autouse=True)
def learning_record_service(monkeypatch):
    service = LearningRecordService()
    monkeypatch.setattr(main, "learning_record_service", service)
    return service


def test_create_learning_record(learning_record_service):
    payload = {
        "question": " 2x+3=7 ",
        "user_marked_understood": True,
        "current_step": 3,
        "hint_count": 3,
    }

    response = client.post("/api/learning-records", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["question"] == "2x+3=7"
    assert body["user_marked_understood"] is True
    assert body["current_step"] == 3
    assert body["hint_count"] == 3
    assert datetime.fromisoformat(body["completed_at"]).tzinfo is not None
    assert len(learning_record_service.list_records()) == 1


def test_stored_learning_record_cannot_be_modified(learning_record_service):
    response = client.post(
        "/api/learning-records",
        json={
            "question": "2x+3=7",
            "user_marked_understood": True,
            "current_step": 1,
            "hint_count": 2,
        },
    )
    stored_record = learning_record_service.list_records()[0]

    assert response.status_code == 201
    with pytest.raises(ValidationError):
        stored_record.question = "書き換えられた問題"


def test_learning_record_rejects_empty_question(learning_record_service):
    response = client.post(
        "/api/learning-records",
        json={
            "question": "   ",
            "user_marked_understood": True,
            "current_step": 0,
            "hint_count": 0,
        },
    )

    assert response.status_code == 422
    assert learning_record_service.list_records() == ()


def test_learning_record_rejects_negative_current_step():
    response = client.post(
        "/api/learning-records",
        json={
            "question": "2x+3=7",
            "user_marked_understood": True,
            "current_step": -1,
            "hint_count": 0,
        },
    )

    assert response.status_code == 422


def test_learning_record_rejects_negative_hint_count():
    response = client.post(
        "/api/learning-records",
        json={
            "question": "2x+3=7",
            "user_marked_understood": True,
            "current_step": 0,
            "hint_count": -1,
        },
    )

    assert response.status_code == 422


@pytest.mark.parametrize("user_marked_understood", [True, False])
def test_learning_record_preserves_user_self_report(
    user_marked_understood, learning_record_service
):
    response = client.post(
        "/api/learning-records",
        json={
            "question": "2x+3=7",
            "user_marked_understood": user_marked_understood,
            "current_step": 0,
            "hint_count": 1,
        },
    )

    assert response.status_code == 201
    assert response.json()["user_marked_understood"] is user_marked_understood
    stored_record = learning_record_service.list_records()[0]
    assert stored_record.user_marked_understood is user_marked_understood
