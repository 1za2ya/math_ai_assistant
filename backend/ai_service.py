import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from prompt import MATH_HINT_INSTRUCTIONS

load_dotenv()

MODEL = "gemini-3.6-flash"


def generate_first_hint(question: str) -> str:
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
            ),
        )
    except Exception as error:
        raise RuntimeError("Gemini API request failed") from error

    if not response.text:
        raise RuntimeError("Gemini API returned an empty response")

    return response.text
