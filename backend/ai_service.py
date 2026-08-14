import json
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from constants import MIN_STEPS, MAX_STEPS
from prompt import MATH_HINT_INSTRUCTIONS, MORE_HINT_INSTRUCTIONS, build_more_hint_input

load_dotenv()

MODEL = "gemini-3.6-flash"

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


def _generate_text(
    contents: str,
    system_instruction: str,
    response_schema: dict[str, object] | None = None,
) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    config = {"system_instruction": system_instruction}
    if response_schema is not None:
        config.update(
            response_mime_type="application/json",
            response_schema=response_schema,
        )

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(**config),
        )
    except Exception as error:
        raise RuntimeError("Gemini API request failed") from error

    text = response.text.strip() if response.text else ""
    if not text:
        raise RuntimeError("Gemini API returned an empty response")

    return text


def generate_solution(question: str) -> dict[str, list[str] | str]:
    response_text = _generate_text(
        contents=question,
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
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
        raise RuntimeError("Gemini API returned an invalid solution") from error

    return {
        "steps": [step.strip() for step in steps],
        "hint": hint.strip(),
    }


def generate_more_hint(question: str, hint_level: int, steps: list[str]) -> str:
    return _generate_text(
        contents=build_more_hint_input(question, hint_level, steps),
        system_instruction=MORE_HINT_INSTRUCTIONS,
    )
