import logging
from typing import Annotated

from fastapi import APIRouter, FastAPI, HTTPException, status
from pydantic import BaseModel, Field, StringConstraints, model_validator

from ai_service import generate_solution, generate_step_detail, generate_step_hint
from constants import MAX_STEPS, MIN_STEPS
from diagram_schema import DiagramResponse

logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

NonEmptyText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class ChatRequest(BaseModel):
    question: NonEmptyText


class ChatResponse(BaseModel):
    steps: list[str]
    hint: str
    calculation_steps: list[NonEmptyText] = Field(min_length=1)
    diagram: DiagramResponse


class StepContextRequest(BaseModel):
    question: NonEmptyText
    steps: list[NonEmptyText] = Field(min_length=MIN_STEPS, max_length=MAX_STEPS)
    current_step: int = Field(strict=True, ge=0)

    @model_validator(mode="after")
    def validate_current_step(self):
        if self.current_step >= len(self.steps):
            raise ValueError("current_step must reference an existing step")
        return self


class StepHintResponse(BaseModel):
    hint: str
    current_step: int


class StepDetailRequest(StepContextRequest):
    detail_question: NonEmptyText


class StepDetailResponse(BaseModel):
    explanation: str
    current_step: int


def generation_unavailable() -> HTTPException:
    logger.exception("Hint generation is unavailable")
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="現在ヒントを生成できません。時間をおいて再度お試しください。",
    )


@app.get("/")
def read_root():
    return {"message": "Math AI backend is running"}


@api_router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    try:
        solution = generate_solution(request.question)
    except RuntimeError:
        raise generation_unavailable() from None

    return ChatResponse(**solution)


@api_router.post("/hint", response_model=StepHintResponse)
def step_hint(request: StepContextRequest) -> StepHintResponse:
    try:
        hint = generate_step_hint(
            request.question, request.steps, request.current_step
        )
    except RuntimeError:
        raise generation_unavailable() from None

    return StepHintResponse(hint=hint, current_step=request.current_step)


@api_router.post("/detail", response_model=StepDetailResponse)
def step_detail(request: StepDetailRequest) -> StepDetailResponse:
    try:
        explanation = generate_step_detail(
            request.question,
            request.steps,
            request.current_step,
            request.detail_question,
        )
    except RuntimeError:
        raise generation_unavailable() from None

    return StepDetailResponse(
        explanation=explanation, current_step=request.current_step
    )


app.include_router(api_router)
