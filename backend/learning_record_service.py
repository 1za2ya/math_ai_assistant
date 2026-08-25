from datetime import datetime, timezone
from threading import Lock

from learning_record_schemas import LearningRecordCreate, LearningRecordResponse


class LearningRecordService:
    def __init__(self) -> None:
        self._records: list[LearningRecordResponse] = []
        self._lock = Lock()

    def create(self, record: LearningRecordCreate) -> LearningRecordResponse:
        stored_record = LearningRecordResponse(
            **record.model_dump(),
            completed_at=datetime.now(timezone.utc),
        )
        with self._lock:
            self._records.append(stored_record)
        return stored_record

    def list_records(self) -> tuple[LearningRecordResponse, ...]:
        with self._lock:
            return tuple(self._records)
