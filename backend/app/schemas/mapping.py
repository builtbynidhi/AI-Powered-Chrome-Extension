from typing import Literal, Optional

from pydantic import Field

from .resume import CamelModel, ResumeProfile

FieldType = Literal[
    "text",
    "textarea",
    "select-native",
    "listbox-custom",
    "date-segmented",
    "radio-pill",
    "checkbox-pill",
    "file-upload",
    "repeatable-group",
]


class FieldDescriptor(CamelModel):
    """Mirrors extension/src/shared/types.ts::FieldDescriptor. Only the
    subset the mapper actually needs is required here (no domRef, obviously)."""

    id: str
    label: str
    type: FieldType
    options: list[str] = Field(default_factory=list)
    required: bool = False
    current_value: Optional[str] = None
    container_step: str = ""


class MapperResult(CamelModel):
    field_id: str
    value: str
    confidence: float
    source_facts: list[str] = Field(default_factory=list)
    needs_user_review: bool
    resolved_by: Literal["heuristic", "ai"] = "ai"


class MapFieldsRequest(CamelModel):
    step: str
    fields: list[FieldDescriptor]
    resume: ResumeProfile


class MapFieldsResponse(CamelModel):
    results: list[MapperResult]


class GenerateAnswerRequest(CamelModel):
    field: FieldDescriptor
    resume: ResumeProfile


class GenerateAnswerResponse(CamelModel):
    result: MapperResult
