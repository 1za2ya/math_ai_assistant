import pytest
from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


def test_chat_returns_generated_hint(monkeypatch):
    expected_hint = "まず問題文から分かる条件を整理してみましょう。"

    def generate_hint_stub(question):
        assert question == "2x + 5 = 17"
        return expected_hint

    monkeypatch.setattr(main, "generate_first_hint", generate_hint_stub)

    response = client.post("/chat", json={"question": "  2x + 5 = 17  "})

    assert response.status_code == 200
    assert response.json() == {"message": expected_hint}


@pytest.mark.parametrize("question", ["", "   "])
def test_chat_rejects_empty_question(question):
    response = client.post("/chat", json={"question": question})

    assert response.status_code == 422


def test_chat_returns_503_when_hint_generation_fails(monkeypatch):
    def generate_hint_stub(_question):
        raise RuntimeError("Gemini API request failed")

    monkeypatch.setattr(main, "generate_first_hint", generate_hint_stub)

    response = client.post("/chat", json={"question": "2x + 5 = 17"})

    assert response.status_code == 503
    assert response.json() == {
        "detail": "現在ヒントを生成できません。時間をおいて再度お試しください。"
    }
