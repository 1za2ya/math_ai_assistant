import json

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


def test_generate_solution_normalizes_structured_response(monkeypatch):
    response_text = json.dumps(
        {
            "steps": [" 条件を整理する ", " 式を立てる ", " 式を解く ", " 確認する "],
            "hint": " 最初に条件を整理してみましょう。 ",
        }
    )
    client = ClientStub(response_text)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(ai_service.genai, "Client", lambda api_key: client)

    solution = ai_service.generate_solution("2x + 5 = 17")

    assert solution == {
        "steps": ["条件を整理する", "式を立てる", "式を解く", "確認する"],
        "hint": "最初に条件を整理してみましょう。",
    }
    assert client.models.last_request["config"].response_mime_type == "application/json"


def test_generate_step_hint_uses_selected_step(monkeypatch):
    client = ClientStub("  次に両辺から5を引くとどうなるでしょうか？  ")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(ai_service.genai, "Client", lambda api_key: client)

    steps = ["条件を整理する", "式を立てる", "式を変形する", "結果を確認する"]
    hint = ai_service.generate_step_hint("2x + 5 = 17", steps, 1)

    assert hint == "次に両辺から5を引くとどうなるでしょうか？"
    assert "現在のステップ:\n式を立てる" in client.models.last_request["contents"]
