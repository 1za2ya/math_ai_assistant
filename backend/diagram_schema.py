import math
from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    ValidationError,
    field_validator,
    model_validator,
)

NonEmptyText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class DiagramPoint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: NonEmptyText
    x: int | float | None
    y: int | float | None

    @field_validator("x", "y", mode="before")
    @classmethod
    def validate_coordinate(cls, value):
        if value is None:
            return value
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
        ):
            raise ValueError("diagram coordinates must be finite numbers or null")
        return value


class DiagramSegment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    from_: NonEmptyText = Field(alias="from")
    to: NonEmptyText
    label: NonEmptyText | None


class DiagramData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    points: list[DiagramPoint]
    segments: list[DiagramSegment]
    expressions: list[NonEmptyText]

    @model_validator(mode="after")
    def validate_references(self):
        if not self.points and not self.segments and not self.expressions:
            raise ValueError("diagram data must not be empty")

        point_labels = [point.label for point in self.points]
        if len(point_labels) != len(set(point_labels)):
            raise ValueError("diagram point labels must be unique")

        known_labels = set(point_labels)
        for segment in self.segments:
            if segment.from_ not in known_labels or segment.to not in known_labels:
                raise ValueError("diagram segments must reference existing points")
        return self


class DiagramResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    needed: bool = Field(strict=True)
    type: NonEmptyText | None
    data: DiagramData | None

    @model_validator(mode="after")
    def validate_data_consistency(self):
        if self.needed:
            if self.type is None or self.data is None:
                raise ValueError("type and data are required when diagram is needed")
        elif self.type is not None or self.data is not None:
            raise ValueError("type and data must be null when diagram is not needed")
        return self


def normalize_diagram_data(value: object) -> dict[str, object]:
    try:
        diagram_data = DiagramData.model_validate(value)
    except ValidationError as error:
        raise ValueError("Gemini API returned invalid diagram data") from error

    return diagram_data.model_dump(by_alias=True)
