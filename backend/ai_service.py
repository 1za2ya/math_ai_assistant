import json
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from prompt import MATH_HINT_INSTRUCTIONS

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


def generate_solution(question: str) -> dict[str, list[str] | str]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=MODEL,
            contents=question,
            config=types.GenerateContentConfig(
                system_instruction=MATH_HINT_INSTRUCTIONS,
                response_mime_type="application/json",
                response_schema=SOLUTION_SCHEMA,
            ),
        )

        if not response.text:
            raise ValueError("Gemini API returned an empty response")

        solution = json.loads(response.text)
        steps = solution["steps"]
        hint = solution["hint"]
        if (
            not isinstance(steps, list)
            or not 4 <= len(steps) <= 6
            or not all(isinstance(step, str) and step.strip() for step in steps)
        ):
            raise ValueError("Gemini API returned invalid steps")
        if not isinstance(hint, str) or not hint:
            raise ValueError("Gemini API returned an invalid hint")
    except Exception as error:
        raise RuntimeError("Gemini API request failed") from error

    return {"steps": steps, "hint": hint}
