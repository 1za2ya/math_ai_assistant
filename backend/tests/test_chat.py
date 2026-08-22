import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

import main

client = TestClient(main.app)


@pytest.mark.parametrize(
    "diagram",
    [
        {"needed": False, "type": None, "data": None},
        {
            "needed": True,
            "type": "coordinate-plane",
            "data": {
                "points": [
                    {"label": "A", "x": 0, "y": 0},
                    {"label": "B", "x": 2, "y": 1},
                ],
                "segments": [{"from": "A", "to": "B", "label": "AB"}],
                "expressions": [],
            },
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

    response = client.post("/api/chat", json={"question": "2x + 5 = 17"})

    assert response.status_code == 200
    assert response.json() == solution
    assert isinstance(response.json()["calculation_steps"], list)


@pytest.mark.parametrize(
    "diagram",
    [
        {"needed": True, "type": None, "data": {}},
        {"needed": True, "type": "coordinate-plane", "data": None},
        {"needed": False, "type": "coordinate-plane", "data": {}},
    ],
)
def test_diagram_response_rejects_inconsistent_data(diagram):
    with pytest.raises(ValidationError):
        main.DiagramResponse(**diagram)


@pytest.mark.parametrize(
    "data",
    [
        {"points": [{"label": "A", "x": 0, "y": 0}]},
        {
            "points": [
                {"label": "A", "x": 0, "y": 0},
                {"label": "A", "x": 1, "y": 1},
            ],
            "segments": [],
            "expressions": [],
        },
        {
            "points": [{"label": "A", "x": 0, "y": 0}],
            "segments": [{"from": "A", "to": "B", "label": None}],
            "expressions": [],
        },
    ],
)
def test_diagram_response_rejects_invalid_nested_data(data):
    with pytest.raises(ValidationError):
        main.DiagramResponse(needed=True, type="coordinate-plane", data=data)
