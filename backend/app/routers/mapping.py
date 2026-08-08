from fastapi import APIRouter, HTTPException

from ..schemas.mapping import (
    GenerateAnswerRequest,
    GenerateAnswerResponse,
    MapFieldsRequest,
    MapFieldsResponse,
)
from ..services.mapping.graph import generate_answer, map_fields

router = APIRouter(prefix="/mapping", tags=["mapping"])


@router.post("/map-fields", response_model=MapFieldsResponse)
def map_fields_endpoint(request: MapFieldsRequest) -> MapFieldsResponse:
    try:
        results = map_fields(request.step, request.fields, request.resume)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="AI mapping service is temporarily unavailable.") from exc
    return MapFieldsResponse(results=results)


@router.post("/generate-answer", response_model=GenerateAnswerResponse)
def generate_answer_endpoint(request: GenerateAnswerRequest) -> GenerateAnswerResponse:
    try:
        result = generate_answer(request.field, request.resume)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="AI answer service is temporarily unavailable.") from exc
    return GenerateAnswerResponse(result=result)
