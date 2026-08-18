from fastapi.testclient import TestClient

import main

client = TestClient(main.app)

STEPS = ["条件を整理する", "式を立てる", "式を変形する", "結果を確認する"]
HISTORY = [
    {"role": "user", "content": "2x + 5 = 17"},
    {"role": "assistant", "content": "まず条件を整理しましょう。"},
]


def test_step_hint_returns_hint_with_history(monkeypatch):
    def generate_step_hint_stub(question, steps, current_step, history):
        assert question == "2x + 5 = 17"
        assert steps == STEPS
        assert current_step == 1
        assert history == HISTORY
        return "両辺から同じ数を引くと、等式はどうなるでしょうか？"

    monkeypatch.setattr(main, "generate_step_hint", generate_step_hint_stub)

    response = client.post(
        "/hint",
        json={
            "question": "2x + 5 = 17",
            "steps": STEPS,
            "current_step": 1,
            "history": HISTORY,
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "hint": "両辺から同じ数を引くと、等式はどうなるでしょうか？",
        "current_step": 1,
    }


def test_step_hint_rejects_negative_current_step():
    response = client.post(
        "/hint",
        json={"question": "2x + 5 = 17", "steps": STEPS, "current_step": -1},
    )

    assert response.status_code == 422


def test_step_hint_rejects_boolean_current_step():
    response = client.post(
        "/hint",
        json={"question": "2x + 5 = 17", "steps": STEPS, "current_step": True},
    )

    assert response.status_code == 422


def test_step_hint_rejects_current_step_outside_steps():
    response = client.post(
        "/hint",
        json={
            "question": "2x + 5 = 17",
            "steps": STEPS,
            "current_step": len(STEPS),
        },
    )

    assert response.status_code == 422


def test_step_hint_returns_503_when_generation_fails(monkeypatch):
    def fail_generation(question, steps, current_step, history):
        raise RuntimeError("internal Gemini error")

    monkeypatch.setattr(main, "generate_step_hint", fail_generation)

    response = client.post(
        "/hint",
        json={"question": "2x + 5 = 17", "steps": STEPS, "current_step": 1},
    )

    assert response.status_code == 503
    assert "Gemini" not in response.json()["detail"]


def test_step_detail_keeps_current_step_and_passes_history(monkeypatch):
    def generate_step_detail_stub(
        question, steps, current_step, detail_question, history
    ):
        assert question == "2x + 5 = 17"
        assert steps == STEPS
        assert current_step == 1
        assert detail_question == "なぜ両辺から5を引くの？"
        assert history == HISTORY
        return "等式を保ったまま定数項をなくすためです。"

    monkeypatch.setattr(main, "generate_step_detail", generate_step_detail_stub)

    response = client.post(
        "/detail",
        json={
            "question": "2x + 5 = 17",
            "steps": STEPS,
            "current_step": 1,
            "detail_question": "なぜ両辺から5を引くの？",
            "history": HISTORY,
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "explanation": "等式を保ったまま定数項をなくすためです。",
        "current_step": 1,
    }
