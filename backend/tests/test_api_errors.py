def test_invalid_resume_file_returns_400(client):
    response = client.post("/resume/parse", json={"fileBase64": "%%%", "fileName": "resume.pdf", "mimeType": "application/pdf"})
    assert response.status_code == 400
    assert "valid base64" in response.json()["detail"]
