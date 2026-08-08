import pytest
import base64

from app.services.resume_parser.extract_text import extract_text


def test_extract_text_rejects_invalid_base64():
    with pytest.raises(ValueError, match="valid base64"):
        extract_text("%%%", "application/pdf")


def test_extract_text_rejects_unsupported_type():
    with pytest.raises(ValueError, match="Unsupported"):
        extract_text("aGVsbG8=", "text/plain")


def test_extract_text_rejects_empty_pdf(empty_pdf_base64):
    with pytest.raises(ValueError, match="no readable text"):
        extract_text(empty_pdf_base64, "application/pdf")


def test_extract_text_rejects_files_over_ten_megabytes():
    payload = base64.b64encode(b"x" * (10 * 1024 * 1024 + 1)).decode()
    with pytest.raises(ValueError, match="10 MB"):
        extract_text(payload, "application/pdf")
