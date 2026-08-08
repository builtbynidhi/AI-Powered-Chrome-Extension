from app.schemas.resume import ResumeProfile


def test_resume_profile_serializes_camel_case():
    profile = ResumeProfile(first_name="Ada", last_name="Lovelace", email="ada@example.com")
    data = profile.model_dump(by_alias=True)
    assert data["firstName"] == "Ada"
    assert data["lastName"] == "Lovelace"
