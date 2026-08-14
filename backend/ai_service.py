import json
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

from constants import MIN_STEPS, MAX_STEPS
from prompt import MATH_HINT_INSTRUCTIONS, MORE_HINT_INSTRUCTIONS, build_more_hint_input

load_dotenv(Path(__file__).with_name(".env"))

MODEL = "gemini-2.5-flash"

SOLUTION_SCHEMA = {
    "type": "object",
    "properties": {
        "steps": {
            "type": "array",
            "items": {"type": "string"},
        },
        "hint": {"type": "string"},
    },
    "required": ["steps", "hint"],
}


def _build_contents(
    current_input: str, history: list[dict[str, str]]
) -> list[types.Content]:
    contents = [
        types.Content(
            role="model" if message["role"] == "assistant" else "user",
            parts=[types.Part.from_text(text=message["content"])],
        )
        for message in history
    ]
    contents.append(
        types.Content(role="user", parts=[types.Part.from_text(text=current_input)])
    )
    return contents


def _generate_text(
    contents: list[types.Content],
    system_instruction: str,
    response_schema: dict | None = None,
) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    try:
        client = genai.Client(api_key=api_key)
        config = {
            "system_instruction": system_instruction,
        }
        if response_schema is not None:
            config.update(
                response_mime_type="application/json",
                response_schema=response_schema,
            )

        response = client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(**config),
        )

        response_text = response.text.strip() if response.text else ""
        if not response_text:
            raise ValueError("Gemini API returned an empty response")
        return response_text
    except Exception as error:
        raise RuntimeError("Gemini API request failed") from error


def generate_solution(
    question: str, history: list[dict[str, str]] | None = None
) -> dict[str, list[str] | str]:
    response_text = _generate_text(
        contents=_build_contents(question, history or []),
        system_instruction=MATH_HINT_INSTRUCTIONS,
        response_schema=SOLUTION_SCHEMA,
    )

    try:
        solution = json.loads(response_text)
        steps = solution["steps"]
        hint = solution["hint"]
        if (
            not isinstance(steps, list)
            or not MIN_STEPS <= len(steps) <= MAX_STEPS
            or not all(isinstance(step, str) and step.strip() for step in steps)
        ):
            raise ValueError("Gemini API returned invalid steps")
        if not isinstance(hint, str) or not hint.strip():
            raise ValueError("Gemini API returned an invalid hint")
    except Exception as error:
        raise RuntimeError("Gemini API request failed") from error

    return {"steps": [step.strip() for step in steps], "hint": hint.strip()}


def generate_more_hint(
    question: str,
    hint_level: int,
    steps: list[str],
    history: list[dict[str, str]] | None = None,
) -> str:
    current_input = build_more_hint_input(question, hint_level, steps)
    return _generate_text(
        contents=_build_contents(current_input, history or []),
        system_instruction=MORE_HINT_INSTRUCTIONS,
    )
