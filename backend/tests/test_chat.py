import pytest
from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


@pytest.mark.parametrize(
    "diagram",
    [
        {"needed": False, "type": None, "data": None},
        {
            "needed": True,
            "type": "coordinate-plane",
            "data": {"points": [{"label": "A", "x": 0, "y": 0}]},
        },
    ],
)
def test_chat_returns_calculation_steps_and_diagram(monkeypatch, diagram):
    solution = {
        "steps": ["条件を整理する", "式を立てる", "式を変形する", "結果を確認する"],
        "hint": "まず問題文の条件を整理してみましょう。",
        "calculation_steps": ["2x + 5 = 17", "2x = 12"],
        "diagram": diagram,
    }
    monkeypatch.setattr(main, "generate_solution", lambda _question: solution)

    response = client.post("/chat", json={"question": "2x + 5 = 17"})

    assert response.status_code == 200
    assert response.json() == solution
    assert isinstance(response.json()["calculation_steps"], list)
