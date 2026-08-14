import pytest
from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


@pytest.mark.parametrize("hint_level", [1, 2, 3])
def test_more_hint_returns_hint_for_each_level(monkeypatch, hint_level):
    def generate_more_hint_stub(question, requested_level, steps):
        assert question == "2x + 5 = 17"
        assert requested_level == hint_level
        assert steps == ["条件を整理する", "式を変形する"]
        return f"レベル{hint_level}のヒント"

    monkeypatch.setattr(main, "generate_more_hint", generate_more_hint_stub)

    response = client.post(
        "/hint",
        json={
            "question": "2x + 5 = 17",
            "hint_level": hint_level,
            "steps": ["条件を整理する", "式を変形する"],
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "hint": f"レベル{hint_level}のヒント",
        "hint_level": hint_level,
    }


@pytest.mark.parametrize("hint_level", [0, 4])
def test_more_hint_rejects_out_of_range_level(hint_level):
    response = client.post(
        "/hint",
        json={"question": "2x + 5 = 17", "hint_level": hint_level},
    )

    assert response.status_code == 422


def test_more_hint_returns_503_when_generation_fails(monkeypatch):
    def generate_more_hint_stub(_question, _hint_level, _steps):
        raise RuntimeError("Gemini API request failed")

    monkeypatch.setattr(main, "generate_more_hint", generate_more_hint_stub)

    response = client.post(
        "/hint",
        json={"question": "2x + 5 = 17", "hint_level": 1},
    )

    assert response.status_code == 503
    assert response.json() == {
        "detail": "現在ヒントを生成できません。時間をおいて再度お試しください。"
    }
