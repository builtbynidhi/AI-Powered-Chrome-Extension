import base64
import io
import pathlib
import sys

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfWriter

sys.path.insert(0, str(pathlib.Path(__file__).parents[1]))


@pytest.fixture
def client(monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    from app.main import app

    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def empty_pdf_base64() -> str:
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    stream = io.BytesIO()
    writer.write(stream)
    return base64.b64encode(stream.getvalue()).decode()
