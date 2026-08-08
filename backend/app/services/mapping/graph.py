# Minimal LangGraph: map_fields -> (confidence branch) -> flag_for_review -> END.
# Deliberately 3 nodes, no multi-agent/ReAct loop — the assignment's mapping
# problem is a single batched classification+generation step per form step,
# not a multi-turn agentic task, so more graph complexity buys nothing.

from typing import TypedDict

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from ...config import GEMINI_MODEL, require_google_api_key
from ...schemas.mapping import FieldDescriptor, MapperResult
from ...schemas.resume import ResumeProfile
from .heuristics import enforce_policy
from .prompts import ANSWER_SYSTEM_PROMPT, MAPPING_SYSTEM_PROMPT


class RawMapping(BaseModel):
    field_id: str = Field(description="Must match one of the given field ids exactly")
    value: str
    confidence: float
    source_facts: list[str] = Field(default_factory=list)


class RawMappingBatch(BaseModel):
    results: list[RawMapping]


class MapFieldsState(TypedDict):
    step: str
    fields: list[FieldDescriptor]
    resume: ResumeProfile
    raw: list[RawMapping]
    results: list[MapperResult]


def _map_fields_node(state: MapFieldsState) -> MapFieldsState:
    llm = ChatGoogleGenerativeAI(model=GEMINI_MODEL, google_api_key=require_google_api_key(), temperature=0)
    structured_llm = llm.with_structured_output(RawMappingBatch)
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", MAPPING_SYSTEM_PROMPT),
            (
                "human",
                "Resume JSON:\n{resume_json}\n\nStep: {step}\n\nFields (id, label, type, options):\n{fields_json}",
            ),
        ]
    )
    fields_json = [
        {"id": f.id, "label": f.label, "type": f.type, "options": f.options, "required": f.required}
        for f in state["fields"]
    ]
    batch = (prompt | structured_llm).invoke(
        {
            "resume_json": state["resume"].model_dump_json(by_alias=True),
            "step": state["step"],
            "fields_json": fields_json,
        }
    )
    return {**state, "raw": batch.results}  # type: ignore[typeddict-item]


def _needs_review_branch(state: MapFieldsState) -> str:
    # Always run every result through the same flag_for_review node — the
    # "branch" is the policy decision made per-field inside that node, not a
    # skip here. Kept as an explicit conditional edge (rather than folding
    # flag_for_review into map_fields) so the confidence policy is a visibly
    # separate, auditable graph step.
    return "flag_for_review"


def _flag_for_review_node(state: MapFieldsState) -> MapFieldsState:
    fields_by_id = {f.id: f for f in state["fields"]}
    results: list[MapperResult] = []
    for raw in state["raw"]:
        field = fields_by_id.get(raw.field_id)
        if field is None:
            continue  # model referenced an id we didn't send — drop it
        results.append(enforce_policy(field, raw.value, raw.confidence, raw.source_facts))
    return {**state, "results": results}


def build_graph():
    graph = StateGraph(MapFieldsState)
    graph.add_node("map_fields", _map_fields_node)
    graph.add_node("flag_for_review", _flag_for_review_node)
    graph.set_entry_point("map_fields")
    graph.add_conditional_edges("map_fields", _needs_review_branch, {"flag_for_review": "flag_for_review"})
    graph.add_edge("flag_for_review", END)
    return graph.compile()


_compiled_graph = None


def map_fields(step: str, fields: list[FieldDescriptor], resume: ResumeProfile) -> list[MapperResult]:
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    final_state = _compiled_graph.invoke(
        {"step": step, "fields": fields, "resume": resume, "raw": [], "results": []}
    )
    return final_state["results"]


def generate_answer(field: FieldDescriptor, resume: ResumeProfile) -> MapperResult:
    # Single open-ended question, e.g. "Why do you want to work here?" — kept
    # separate from the batched map_fields graph since it's always one field,
    # always flagged for review (see heuristics.enforce_policy), and uses a
    # more conservative, hallucination-averse prompt.
    llm = ChatGoogleGenerativeAI(model=GEMINI_MODEL, google_api_key=require_google_api_key(), temperature=0.3)
    structured_llm = llm.with_structured_output(RawMapping)
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", ANSWER_SYSTEM_PROMPT),
            (
                "human",
                "Resume JSON:\n{resume_json}\n\nQuestion label: {label}\nMax length: {max_length}",
            ),
        ]
    )
    raw = (prompt | structured_llm).invoke(
        {
            "resume_json": resume.model_dump_json(by_alias=True),
            "label": field.label,
            "max_length": "none specified",
        }
    )
    raw.field_id = field.id
    if field.required and len(raw.value) == 0:
        raw.confidence = 0.0
    return enforce_policy(field, raw.value, raw.confidence, raw.source_facts)
