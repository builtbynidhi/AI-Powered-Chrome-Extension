import base64
import binascii
import io

from docx import Document
from pypdf import PdfReader

MAX_RESUME_BYTES = 10 * 1024 * 1024


def extract_text(file_base64: str, mime_type: str) -> str:
    try:
        raw = base64.b64decode(file_base64, validate=True)
    except (ValueError, binascii.Error) as exc:
        raise ValueError("Resume file is not valid base64.") from exc
    if len(raw) > MAX_RESUME_BYTES:
        raise ValueError("Resume file exceeds the 10 MB limit.")
    buf = io.BytesIO(raw)

    if "pdf" in mime_type:
        reader = PdfReader(buf)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)

    elif "wordprocessingml" in mime_type or "docx" in mime_type:
        doc = Document(buf)
        text = "\n".join(p.text for p in doc.paragraphs)

    else:
        raise ValueError(f"Unsupported resume file type: {mime_type}. Accepted: PDF, DOCX.")

    if not text.strip():
        raise ValueError("Resume contains no readable text.")
    return text
