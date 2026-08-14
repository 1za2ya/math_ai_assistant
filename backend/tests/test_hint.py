import pytest
import main
from fastapi.testclient import TestClient

client = TestClient(main.app)


@pytest.mark.parametrize("hint_level", [1, 2, 3])
def test_hint_accepts_supported_levels(monkeypatch, hint_level):
    def fake_generate_more_hint(question, received_level, steps, history):
        assert question == "2x + 3 = 7"
        assert received_level == hint_level
        assert history == []
        return f"レベル{received_level}のヒント"

    monkeypatch.setattr(main, "generate_more_hint", fake_generate_more_hint)

    response = client.post(
        "/hint", json={"question": "2x + 3 = 7", "hint_level": hint_level}
    )

    assert response.status_code == 200
    assert response.json() == {
        "hint": f"レベル{hint_level}のヒント",
        "hint_level": hint_level,
    }


@pytest.mark.parametrize("hint_level", [0, 4])
def test_hint_rejects_out_of_range_level(hint_level):
    response = client.post(
        "/hint", json={"question": "2x + 3 = 7", "hint_level": hint_level}
    )

    assert response.status_code == 422


def test_hint_returns_503_when_generation_fails(monkeypatch):
    def fail_generation(question, hint_level, steps, history):
        raise RuntimeError("internal Gemini error")

    monkeypatch.setattr(main, "generate_more_hint", fail_generation)

    response = client.post(
        "/hint", json={"question": "2x + 3 = 7", "hint_level": 2}
    )

    assert response.status_code == 503
    assert "Gemini" not in response.json()["detail"]
