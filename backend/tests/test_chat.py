from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


def test_chat_keeps_existing_response_contract(monkeypatch):
    solution = {
        "steps": ["条件を整理する", "式を立てる", "式を変形する", "結果を確認する"],
        "hint": "まず問題文の条件を整理してみましょう。",
    }
    monkeypatch.setattr(main, "generate_solution", lambda _question: solution)

    response = client.post("/chat", json={"question": "2x + 5 = 17"})

    assert response.status_code == 200
    assert response.json() == solution
