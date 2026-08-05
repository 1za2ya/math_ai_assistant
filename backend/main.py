import logging
from typing import Annotated

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, StringConstraints

from ai_service import generate_first_hint

logger = logging.getLogger(__name__)

app = FastAPI()


class ChatRequest(BaseModel):
    question: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class ChatResponse(BaseModel):
    message: str


@app.get("/")
def read_root():
    return {"message": "Math AI backend is running"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    try:
        hint = generate_first_hint(request.question)
    except RuntimeError:
        logger.exception("Hint generation is unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="現在ヒントを生成できません。時間をおいて再度お試しください。",
        ) from None

    return ChatResponse(message=hint)
