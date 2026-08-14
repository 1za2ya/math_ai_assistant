from types import SimpleNamespace

import ai_service
import pytest


def test_gemini_receives_history_in_role_order(monkeypatch):
    captured = {}

    class FakeModels:
        def generate_content(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(text="次に、両辺から3を引くと何が残るか考えよう。")

    class FakeClient:
        models = FakeModels()

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(ai_service.genai, "Client", lambda api_key: FakeClient())

    history = [
        {"role": "user", "content": "2x + 3 = 7"},
        {"role": "assistant", "content": "まず定数項に注目しよう。"},
    ]
    result = ai_service.generate_more_hint("2x + 3 = 7", 2, [], history)

    contents = captured["contents"]
    assert [content.role for content in contents] == ["user", "model", "user"]
    assert contents[0].parts[0].text == history[0]["content"]
    assert contents[1].parts[0].text == history[1]["content"]
    assert "今回のヒント段階: 2" in contents[2].parts[0].text
    assert result == "次に、両辺から3を引くと何が残るか考えよう。"


def test_whitespace_only_response_is_rejected(monkeypatch):
    class FakeModels:
        def generate_content(self, **kwargs):
            return SimpleNamespace(text="   ")

    class FakeClient:
        models = FakeModels()

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(ai_service.genai, "Client", lambda api_key: FakeClient())

    with pytest.raises(RuntimeError):
        ai_service.generate_more_hint("2x + 3 = 7", 2, [], [])
