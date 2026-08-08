from app.schemas.mapping import FieldDescriptor
from app.services.mapping.heuristics import enforce_policy


def test_nonexistent_choice_is_discarded():
    field = FieldDescriptor(id="x", label="Choice", type="select-native", options=["Yes", "No"])
    result = enforce_policy(field, "Maybe", 0.99, [])
    assert result.value == ""
    assert result.needs_user_review is True


def test_textarea_always_requires_review():
    field = FieldDescriptor(id="x", label="Why?", type="textarea")
    assert enforce_policy(field, "Answer", 0.99, []).needs_user_review is True
