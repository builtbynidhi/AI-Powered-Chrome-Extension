from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base for models exchanged with the extension: Python stays snake_case,
    JSON on the wire is camelCase to match extension/src/shared/types.ts directly."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class WorkExperience(CamelModel):
    title: str
    company: str
    location: Optional[str] = None
    start_date: Optional[str] = Field(None, description="ISO yyyy-mm or yyyy-mm-dd")
    end_date: Optional[str] = Field(None, description='ISO date or the literal "present"')
    description: Optional[str] = None


class Education(CamelModel):
    school: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class Links(CamelModel):
    linkedin: Optional[str] = None
    github: Optional[str] = None
    other: list[str] = Field(default_factory=list)


class ResumeProfile(CamelModel):
    """Structured resume data. Matches extension/src/shared/types.ts::ResumeProfile
    field-for-field (camelCase there, snake_case here) — see resume_parser/parse_chain.py
    for the extraction prompt that fills this in, including the assignment's explicit
    "infer missing info" and "normalize inconsistent formats" requirements."""

    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[dict] = None  # {city, state, country}
    experience: list[WorkExperience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    links: Links = Field(default_factory=Links)


class ParseResumeRequest(CamelModel):
    file_base64: str
    file_name: str
    mime_type: str


class ParseResumeResponse(CamelModel):
    resume: ResumeProfile
