import logging
from typing import Annotated, Literal

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field, StringConstraints, model_validator

from ai_service import generate_solution, generate_step_detail, generate_step_hint
from constants import MAX_HISTORY_MESSAGES, MAX_MESSAGE_LENGTH, MAX_STEPS, MIN_STEPS

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


class StepContextRequest(BaseModel):
    question: ValidatedText
    steps: list[ValidatedText] = Field(min_length=MIN_STEPS, max_length=MAX_STEPS)
    current_step: int = Field(strict=True, ge=0)
    history: list[ConversationMessage] = Field(
        default_factory=list, max_length=MAX_HISTORY_MESSAGES
    )

    @model_validator(mode="after")
    def validate_current_step(self):
        if self.current_step >= len(self.steps):
            raise ValueError("current_step must reference an existing step")
        return self


class StepHintResponse(BaseModel):
    hint: str
    current_step: int


class StepDetailRequest(StepContextRequest):
    detail_question: ValidatedText


class StepDetailResponse(BaseModel):
    explanation: str
    current_step: int


def _history_as_dicts(history: list[ConversationMessage]) -> list[dict[str, str]]:
    return [message.model_dump() for message in history]


def generation_unavailable() -> HTTPException:
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
        raise generation_unavailable() from None

    return ChatResponse(**solution)


@app.post("/hint", response_model=StepHintResponse)
def step_hint(request: StepContextRequest) -> StepHintResponse:
    try:
        hint = generate_step_hint(
            request.question,
            request.steps,
            request.current_step,
            _history_as_dicts(request.history),
        )
    except RuntimeError:
        raise generation_unavailable() from None

    return StepHintResponse(hint=hint, current_step=request.current_step)


@app.post("/detail", response_model=StepDetailResponse)
def step_detail(request: StepDetailRequest) -> StepDetailResponse:
    try:
        explanation = generate_step_detail(
            request.question,
            request.steps,
            request.current_step,
            request.detail_question,
            _history_as_dicts(request.history),
        )
    except RuntimeError:
        raise generation_unavailable() from None

    return StepDetailResponse(
        explanation=explanation, current_step=request.current_step
    )
