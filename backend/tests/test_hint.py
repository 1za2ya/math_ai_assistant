from fastapi.testclient import TestClient

import main

client = TestClient(main.app)

STEPS = ["条件を整理する", "式を立てる", "式を変形する", "結果を確認する"]


def test_step_hint_returns_hint_for_current_step(monkeypatch):
    def generate_step_hint_stub(question, steps, current_step):
        assert question == "2x + 5 = 17"
        assert steps == STEPS
        assert current_step == 1
        return "両辺から同じ数を引くと、等式はどうなるでしょうか？"

    monkeypatch.setattr(main, "generate_step_hint", generate_step_hint_stub)

    response = client.post(
        "/api/hint",
        json={
            "question": "2x + 5 = 17",
            "steps": STEPS,
            "current_step": 1,
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "hint": "両辺から同じ数を引くと、等式はどうなるでしょうか？",
        "current_step": 1,
    }


def test_step_hint_rejects_negative_current_step():
    response = client.post(
        "/api/hint",
        json={
            "question": "2x + 5 = 17",
            "steps": STEPS,
            "current_step": -1,
        },
    )

    assert response.status_code == 422


def test_step_hint_rejects_boolean_current_step():
    response = client.post(
        "/api/hint",
        json={
            "question": "2x + 5 = 17",
            "steps": STEPS,
            "current_step": True,
        },
    )

    assert response.status_code == 422


def test_step_hint_rejects_current_step_outside_steps():
    response = client.post(
        "/api/hint",
        json={
            "question": "2x + 5 = 17",
            "steps": STEPS,
            "current_step": len(STEPS),
        },
    )

    assert response.status_code == 422


def test_step_hint_returns_503_when_generation_fails(monkeypatch):
    def generate_step_hint_stub(_question, _steps, _current_step):
        raise RuntimeError("Gemini API request failed")

    monkeypatch.setattr(main, "generate_step_hint", generate_step_hint_stub)

    response = client.post(
        "/api/hint",
        json={
            "question": "2x + 5 = 17",
            "steps": STEPS,
            "current_step": 1,
        },
    )

    assert response.status_code == 503
    assert response.json() == {
        "detail": "現在ヒントを生成できません。時間をおいて再度お試しください。"
    }


def test_step_detail_keeps_current_step(monkeypatch):
    def generate_step_detail_stub(question, steps, current_step, detail_question):
        assert question == "2x + 5 = 17"
        assert steps == STEPS
        assert current_step == 1
        assert detail_question == "なぜ両辺から5を引くの？"
        return "等式を保ったまま定数項をなくすためです。"

    monkeypatch.setattr(main, "generate_step_detail", generate_step_detail_stub)

    response = client.post(
        "/api/detail",
        json={
            "question": "2x + 5 = 17",
            "steps": STEPS,
            "current_step": 1,
            "detail_question": "なぜ両辺から5を引くの？",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "explanation": "等式を保ったまま定数項をなくすためです。",
        "current_step": 1,
    }
