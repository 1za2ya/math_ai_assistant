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


def configure_client(monkeypatch, response_text):
    client = ClientStub(response_text)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(ai_service.genai, "Client", lambda api_key: client)
    return client


def solution_payload(**overrides):
    payload = {
        "steps": ["条件を整理する", "式を立てる", "式を解く", "確認する"],
        "hint": "最初に条件を整理してみましょう。",
        "calculation_steps": ["2x + 5 = 17", "2x = 12"],
        "diagram": {"needed": False, "type": None, "data": None},
    }
    payload.update(overrides)
    return payload


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
        solution_payload(
            steps=[" 条件を整理する ", " 式を立てる ", " 式を解く ", " 確認する "],
            hint=" 最初に条件を整理してみましょう。 ",
            calculation_steps=[" 2x + 5 = 17 ", " 2x = 12 "],
        )
    )
    client = configure_client(monkeypatch, response_text)

    solution = ai_service.generate_solution("2x + 5 = 17")

    assert solution == solution_payload()
    assert client.models.last_request["config"].response_mime_type == "application/json"


def test_generate_solution_passes_history_to_gemini(monkeypatch):
    client = configure_client(monkeypatch, json.dumps(solution_payload()))
    history = [
        {"role": "user", "content": "この式の意味を知りたい"},
        {"role": "assistant", "content": "まず等号の両側を確認しましょう。"},
    ]

    ai_service.generate_solution("2x + 5 = 17", history)

    contents = client.models.last_request["contents"]
    assert [content.role for content in contents] == ["user", "model", "user"]
    assert contents[0].parts[0].text == history[0]["content"]
    assert contents[1].parts[0].text == history[1]["content"]
    assert contents[2].parts[0].text == "2x + 5 = 17"


def test_generate_solution_keeps_diagram_data_when_needed(monkeypatch):
    diagram = {
        "needed": True,
        "type": "coordinate-plane",
        "data": {
            "points": [{"label": "A", "x": 0, "y": 0}],
            "segments": [],
            "expressions": [],
        },
    }
    configure_client(
        monkeypatch,
        json.dumps(
            solution_payload(
                steps=["条件を整理する", "座標を置く", "式を立てる", "確認する"],
                hint="まず点の位置を図に置いてみましょう。",
                calculation_steps=["A(0, 0)", "B(4, 0)"],
                diagram=diagram,
            )
        ),
    )

    solution = ai_service.generate_solution("点Aを座標平面に表してください")

    assert solution["diagram"] == diagram


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
            {"needed": False, "type": None, "data": None, "extra": "value"},
        ),
    ],
)
def test_generate_solution_rejects_inconsistent_visual_data(
    monkeypatch, calculation_steps, diagram
):
    configure_client(
        monkeypatch,
        json.dumps(
            solution_payload(
                calculation_steps=calculation_steps,
                diagram=diagram,
            )
        ),
    )

    with pytest.raises(RuntimeError, match="invalid solution"):
        ai_service.generate_solution("2x + 5 = 17")


def test_generate_step_hint_passes_history_and_selected_step(monkeypatch):
    client = configure_client(
        monkeypatch, "  次に両辺から5を引くとどうなるでしょうか？  "
    )
    steps = ["条件を整理する", "式を立てる", "式を変形する", "結果を確認する"]
    history = [
        {"role": "user", "content": "2x + 5 = 17"},
        {"role": "assistant", "content": "まず条件を整理しましょう。"},
    ]

    hint = ai_service.generate_step_hint("2x + 5 = 17", steps, 1, history)

    contents = client.models.last_request["contents"]
    assert [content.role for content in contents] == ["user", "model", "user"]
    assert contents[0].parts[0].text == history[0]["content"]
    assert contents[1].parts[0].text == history[1]["content"]
    assert "現在のステップ:\n式を立てる" in contents[2].parts[0].text
    assert hint == "次に両辺から5を引くとどうなるでしょうか？"


def test_whitespace_only_response_is_rejected(monkeypatch):
    configure_client(monkeypatch, "   ")

    with pytest.raises(RuntimeError):
        ai_service.generate_step_hint(
            "2x + 5 = 17",
            ["条件を整理する", "式を立てる", "式を変形する", "結果を確認する"],
            1,
        )


def test_response_text_error_is_normalized(monkeypatch):
    class BrokenResponse:
        @property
        def text(self):
            raise ValueError("response parsing failed")

    class BrokenModels:
        def generate_content(self, **request):
            return BrokenResponse()

    class BrokenClient:
        models = BrokenModels()

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(ai_service.genai, "Client", lambda api_key: BrokenClient())

    with pytest.raises(RuntimeError, match="Gemini API request failed"):
        ai_service.generate_step_hint(
            "2x + 5 = 17",
            ["条件を整理する", "式を立てる", "式を変形する", "結果を確認する"],
            1,
        )
