import logging
from typing import Annotated, Literal

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field, StringConstraints

from ai_service import generate_more_hint, generate_solution
from constants import (
    MAX_HINT_LEVEL,
    MAX_HISTORY_MESSAGES,
    MAX_MESSAGE_LENGTH,
    MAX_STEPS,
    MIN_HINT_LEVEL,
)

logger = logging.getLogger(__name__)

app = FastAPI()

ValidatedText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=MAX_MESSAGE_LENGTH),
]


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: ValidatedText


class ChatRequest(BaseModel):
    question: ValidatedText
    history: list[ConversationMessage] = Field(
        default_factory=list, max_length=MAX_HISTORY_MESSAGES
    )


class ChatResponse(BaseModel):
    steps: list[str]
    hint: str


class HintRequest(BaseModel):
    question: ValidatedText
    hint_level: int = Field(ge=MIN_HINT_LEVEL, le=MAX_HINT_LEVEL)
    steps: list[ValidatedText] = Field(default_factory=list, max_length=MAX_STEPS)
    history: list[ConversationMessage] = Field(
        default_factory=list, max_length=MAX_HISTORY_MESSAGES
    )


class HintResponse(BaseModel):
    hint: str
    hint_level: int


def _history_as_dicts(history: list[ConversationMessage]) -> list[dict[str, str]]:
    return [message.model_dump() for message in history]


def _generation_unavailable() -> HTTPException:
    logger.exception("Hint generation is unavailable")
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="現在ヒントを生成できません。時間をおいて再度お試しください。",
    )


@app.get("/")
def read_root():
    return {"message": "Math AI backend is running"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    try:
        solution = generate_solution(
            request.question, _history_as_dicts(request.history)
        )
    except RuntimeError:
        raise _generation_unavailable() from None

    return ChatResponse(**solution)


@app.post("/hint", response_model=HintResponse)
def more_hint(request: HintRequest) -> HintResponse:
    try:
        hint = generate_more_hint(
            request.question,
            request.hint_level,
            request.steps,
            _history_as_dicts(request.history),
        )
    except RuntimeError:
        raise _generation_unavailable() from None

    return HintResponse(hint=hint, hint_level=request.hint_level)
