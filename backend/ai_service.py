import json
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

from constants import MIN_STEPS, MAX_STEPS
from diagram_schema import normalize_diagram_data
from prompt import (
    MATH_HINT_INSTRUCTIONS,
    STEP_DETAIL_INSTRUCTIONS,
    STEP_HINT_INSTRUCTIONS,
    build_step_detail_input,
    build_step_hint_input,
)

load_dotenv(Path(__file__).with_name(".env"))

MODEL = "gemini-3.6-flash"
SOLUTION_FIELDS = ("steps", "hint", "calculation_steps", "diagram")
DIAGRAM_FIELDS = ("needed", "type", "data")
DIAGRAM_DATA_FIELDS = ("points", "segments", "expressions")

DIAGRAM_DATA_SCHEMA = {
    "type": "object",
    "properties": {
        "points": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "label": {"type": "string"},
                    "x": {"type": "number", "nullable": True},
                    "y": {"type": "number", "nullable": True},
                },
                "required": ["label", "x", "y"],
            },
        },
        "segments": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "from": {"type": "string"},
                    "to": {"type": "string"},
                    "label": {"type": "string", "nullable": True},
                },
                "required": ["from", "to", "label"],
            },
        },
        "expressions": {
            "type": "array",
            "items": {"type": "string"},
        },
    },
    "required": list(DIAGRAM_DATA_FIELDS),
}

SOLUTION_SCHEMA = {
    "type": "object",
    "properties": {
        "steps": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": MIN_STEPS,
            "maxItems": MAX_STEPS,
        },
        "hint": {"type": "string"},
        "calculation_steps": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 1,
        },
        "diagram": {
            "type": "object",
            "properties": {
                "needed": {"type": "boolean"},
                "type": {"type": "string", "nullable": True},
                "data": {**DIAGRAM_DATA_SCHEMA, "nullable": True},
            },
            "required": list(DIAGRAM_FIELDS),
        },
    },
    "required": list(SOLUTION_FIELDS),
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


def _normalize_text_list(value: object, field_name: str) -> list[str]:
    if not isinstance(value, list) or not value or not all(
        isinstance(item, str) and item.strip() for item in value
    ):
        raise ValueError(f"Gemini API returned invalid {field_name}")
    return [item.strip() for item in value]


def generate_solution(question: str) -> dict[str, object]:
    response_text = _generate_text(
        contents=question,
        system_instruction=MATH_HINT_INSTRUCTIONS,
        response_schema=SOLUTION_SCHEMA,
    )

    try:
        solution = json.loads(response_text)
        if not isinstance(solution, dict) or set(solution) != set(SOLUTION_FIELDS):
            raise ValueError("Gemini API returned invalid solution fields")

        steps = _normalize_text_list(solution["steps"], "steps")
        hint = solution["hint"]
        calculation_steps = _normalize_text_list(
            solution["calculation_steps"], "calculation_steps"
        )
        diagram = solution["diagram"]

        if not MIN_STEPS <= len(steps) <= MAX_STEPS:
            raise ValueError("Gemini API returned invalid steps")
        if not isinstance(hint, str) or not hint.strip():
            raise ValueError("Gemini API returned an invalid hint")
        if not isinstance(diagram, dict):
            raise ValueError("Gemini API returned an invalid diagram")
        if set(diagram) != set(DIAGRAM_FIELDS):
            raise ValueError("Gemini API returned invalid diagram fields")

        diagram_needed = diagram["needed"]
        diagram_type = diagram["type"]
        diagram_data = diagram["data"]
        if not isinstance(diagram_needed, bool):
            raise ValueError("Gemini API returned an invalid diagram flag")
        if diagram_type is not None and (
            not isinstance(diagram_type, str) or not diagram_type.strip()
        ):
            raise ValueError("Gemini API returned an invalid diagram type")
        if diagram_needed:
            if diagram_type is None or diagram_data is None:
                raise ValueError("Gemini API returned incomplete diagram data")
            diagram_data = normalize_diagram_data(diagram_data)
        elif diagram_type is not None or diagram_data is not None:
            raise ValueError("Gemini API returned unnecessary diagram data")
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
        raise RuntimeError("Gemini API returned an invalid solution") from error

    return {
        "steps": steps,
        "hint": hint.strip(),
        "calculation_steps": calculation_steps,
        "diagram": {
            "needed": diagram_needed,
            "type": diagram_type.strip() if diagram_type is not None else None,
            "data": diagram_data,
        },
    }


def generate_step_hint(question: str, steps: list[str], current_step: int) -> str:
    return _generate_text(
        contents=build_step_hint_input(question, steps, current_step),
        system_instruction=STEP_HINT_INSTRUCTIONS,
    )


def generate_step_detail(
    question: str, steps: list[str], current_step: int, detail_question: str
) -> str:
    return _generate_text(
        contents=build_step_detail_input(
            question, steps, current_step, detail_question
        ),
        system_instruction=STEP_DETAIL_INSTRUCTIONS,
    )
