# Hard policy applied to every AI-produced mapping result before it ever reaches
# the extension. These rules are enforced in code, not trusted to the model —
# the LLM proposes, this module (and the graph's flag_for_review node) disposes.

from ...schemas.mapping import FieldDescriptor, MapperResult

CONFIDENCE_AUTO_APPLY_THRESHOLD = 0.6

CHOICE_TYPES = {"listbox-custom", "radio-pill", "checkbox-pill", "select-native"}
OPEN_ENDED_TYPES = {"textarea"}


def enforce_policy(field: FieldDescriptor, raw_value: str, raw_confidence: float, source_facts: list[str]) -> MapperResult:
    value = raw_value
    confidence = raw_confidence
    needs_review = False

    if field.type in CHOICE_TYPES and field.options:
        if value not in field.options:
            # Model returned something not in the allowed set — never let the
            # Filler attempt to select a nonexistent option.
            value = ""
            confidence = 0.0
            needs_review = True

    if field.type in OPEN_ENDED_TYPES:
        # Generative text always needs a human look, regardless of model confidence.
        needs_review = True

    if confidence < CONFIDENCE_AUTO_APPLY_THRESHOLD:
        needs_review = True

    return MapperResult(
        field_id=field.id,
        value=value,
        confidence=confidence,
        source_facts=source_facts,
        needs_user_review=needs_review,
        resolved_by="ai",
    )
