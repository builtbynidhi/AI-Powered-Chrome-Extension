from fastapi import APIRouter, HTTPException

from ..schemas.resume import ParseResumeRequest, ParseResumeResponse
from ..services.resume_parser.extract_text import extract_text
from ..services.resume_parser.parse_chain import parse_resume_text

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/parse", response_model=ParseResumeResponse)
def parse_resume(request: ParseResumeRequest) -> ParseResumeResponse:
    try:
        text = extract_text(request.file_base64, request.mime_type)
        resume = parse_resume_text(text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail="AI resume service is temporarily unavailable.") from exc
    return ParseResumeResponse(resume=resume)
