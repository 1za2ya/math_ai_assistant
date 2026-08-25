from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

QuestionText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class LearningRecordCreate(BaseModel):
    question: QuestionText
    user_marked_understood: bool = Field(
        strict=True,
        description="ユーザー自身が問題全体を理解したと申告したか",
    )
    current_step: int = Field(strict=True, ge=0)
    hint_count: int = Field(strict=True, ge=0)


class LearningRecordResponse(LearningRecordCreate):
    model_config = ConfigDict(frozen=True)

    completed_at: datetime
