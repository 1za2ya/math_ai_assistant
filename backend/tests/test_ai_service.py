import json

import pytest
from google.genai import _transformers

import ai_service


class ModelsStub:
    def __init__(self, response_text):
        self.response_text = response_text
        self.last_request = None

    def generate_content(self, **request):
        self.last_request = request
        return type("ResponseStub", (), {"text": self.response_text})()


class ClientStub:
    def __init__(self, response_text):
        self.models = ModelsStub(response_text)


def test_solution_schema_is_supported_by_gemini_sdk():
    client = ai_service.genai.Client(api_key="test-key")

    try:
        converted_schema = _transformers.t_schema(
            client._api_client, ai_service.SOLUTION_SCHEMA
        )
    finally:
        client.close()

    assert converted_schema is not None


def test_generate_solution_normalizes_structured_response(monkeypatch):
    response_text = json.dumps(
        {
            "steps": [" 条件を整理する ", " 式を立てる ", " 式を解く ", " 確認する "],
            "hint": " 最初に条件を整理してみましょう。 ",
            "calculation_steps": [" 2x + 5 = 17 ", " 2x = 12 "],
            "diagram": {"needed": False, "type": None, "data": None},
        }
    )
    client = ClientStub(response_text)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(ai_service.genai, "Client", lambda api_key: client)

    solution = ai_service.generate_solution("2x + 5 = 17")

    assert solution == {
        "steps": ["条件を整理する", "式を立てる", "式を解く", "確認する"],
        "hint": "最初に条件を整理してみましょう。",
        "calculation_steps": ["2x + 5 = 17", "2x = 12"],
        "diagram": {"needed": False, "type": None, "data": None},
    }
    assert client.models.last_request["config"].response_mime_type == "application/json"


def test_generate_solution_keeps_diagram_data_when_needed(monkeypatch):
    response_text = json.dumps(
        {
            "steps": ["条件を整理する", "座標を置く", "式を立てる", "確認する"],
            "hint": "まず点の位置を図に置いてみましょう。",
            "calculation_steps": ["A(0, 0)", "B(4, 0)"],
            "diagram": {
                "needed": True,
                "type": "coordinate-plane",
                "data": {
                    "points": [{"label": "A", "x": 0, "y": 0}],
                    "segments": [],
                    "expressions": [],
                },
            },
        }
    )
    client = ClientStub(response_text)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(ai_service.genai, "Client", lambda api_key: client)

    solution = ai_service.generate_solution("点Aを座標平面に表してください")

    assert solution["diagram"] == {
        "needed": True,
        "type": "coordinate-plane",
        "data": {
            "points": [{"label": "A", "x": 0, "y": 0}],
            "segments": [],
            "expressions": [],
        },
    }


@pytest.mark.parametrize(
    ("calculation_steps", "diagram"),
    [
        ([], {"needed": False, "type": None, "data": None}),
        (
            ["2x + 5 = 17"],
            {"needed": False, "type": "coordinate-plane", "data": {}},
        ),
        (
            ["2x + 5 = 17"],
            {"needed": True, "type": None, "data": {}},
        ),
        (
            ["2x + 5 = 17"],
            {"needed": True, "type": "coordinate-plane", "data": None},
        ),
        (
            ["2x + 5 = 17"],
            {
                "needed": True,
                "type": "coordinate-plane",
                "data": {"points": [], "segments": [], "expressions": []},
            },
        ),
        (
            ["2x + 5 = 17"],
            {
                "needed": True,
                "type": "coordinate-plane",
                "data": {"points": [{"label": "A", "x": 0, "y": 0}]},
            },
        ),
        (
            ["2x + 5 = 17"],
            {
                "needed": True,
                "type": "coordinate-plane",
                "data": {
                    "points": [
                        {"label": "A", "x": 0, "y": 0},
                        {"label": "A", "x": 1, "y": 1},
                    ],
                    "segments": [],
                    "expressions": [],
                },
            },
        ),
        (
            ["2x + 5 = 17"],
            {
                "needed": True,
                "type": "coordinate-plane",
                "data": {
                    "points": [{"label": "A", "x": 0, "y": 0}],
                    "segments": [{"from": "A", "to": "B", "label": None}],
                    "expressions": [],
                },
            },
        ),
        (
            ["2x + 5 = 17"],
            {
                "needed": True,
                "type": "coordinate-plane",
                "data": {
                    "points": [{"label": "A", "x": float("inf"), "y": 0}],
                    "segments": [],
                    "expressions": [],
                },
            },
        ),
        (
            ["2x + 5 = 17"],
            {"needed": False, "type": None, "data": None, "extra": "value"},
        ),
    ],
)
def test_generate_solution_rejects_inconsistent_visual_data(
    monkeypatch, calculation_steps, diagram
):
    response_text = json.dumps(
        {
            "steps": ["条件を整理する", "式を立てる", "式を解く", "確認する"],
            "hint": "まず条件を整理してみましょう。",
            "calculation_steps": calculation_steps,
            "diagram": diagram,
        }
    )
    client = ClientStub(response_text)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(ai_service.genai, "Client", lambda api_key: client)

    with pytest.raises(RuntimeError, match="invalid solution"):
        ai_service.generate_solution("2x + 5 = 17")


def test_generate_step_hint_uses_selected_step(monkeypatch):
    client = ClientStub("  次に両辺から5を引くとどうなるでしょうか？  ")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(ai_service.genai, "Client", lambda api_key: client)

    steps = ["条件を整理する", "式を立てる", "式を変形する", "結果を確認する"]
    hint = ai_service.generate_step_hint("2x + 5 = 17", steps, 1)

    assert hint == "次に両辺から5を引くとどうなるでしょうか？"
    assert "現在のステップ:\n式を立てる" in client.models.last_request["contents"]
