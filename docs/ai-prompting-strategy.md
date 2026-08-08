# AI Prompting Strategy

Model: Google Gemini (`gemini-1.5-flash` by default), via `langchain-google-genai`,
chosen for its free tier — see `limitations.md` for why OpenAI wasn't used.
LangChain's provider abstraction means swapping to OpenAI/Anthropic later is a
one-line change in `backend/app/config.py` + `.env`, not a code rewrite.

## 1. Resume → structured JSON (`resume_parser/parse_chain.py`)

One call, structured output bound directly to the `ResumeProfile` Pydantic
schema (`llm.with_structured_output(ResumeProfile)`) rather than free-text +
manual `json.loads` — validation happens at the LangChain layer, and a
`ValidationError` triggers one repair retry (the model is told its previous
output didn't match the schema and asked again).

The system prompt explicitly instructs the model to:
- **Infer missing/implicit info** — e.g. split "City, State" into parts,
  infer a degree's field of study from a program name, treat a no-end-date
  role as current. This is a literal assignment requirement, not left to
  whatever a generic "extract to JSON" prompt happens to produce.
- **Normalize inconsistent formats** — dates to ISO, phone numbers to a
  consistent digit format, degree names to a common form.
- Never invent facts with no basis in the resume text.

## 2. Field-label → resume-field mapping (`mapping/graph.py`, batched per step)

Input: the candidate's resume JSON + a batch of unresolved fields from one
visible Workday step (`{id, label, type, options}` each). Output: one
`{field_id, value, confidence, source_facts}` per field, via
`with_structured_output(RawMappingBatch)`.

Rules baked into the prompt:
- Reason semantically about the label, not by string matching ("Given Name"
  → first name, "Work Experience Summary" → a summary drawn from the
  experience list).
- For choice fields (listbox/radio/checkbox), the returned value **must** be
  copied verbatim from that field's given `options` — never invented. (Also
  re-checked in code — see `heuristics.py` — so this isn't trust-only.)
- Confidence should honestly reflect uncertainty; guessing is explicitly
  discouraged in favor of a low score.
- `source_facts` must be traceable to the actual resume content — this is
  surfaced to the user in the review panel so they can verify the model's
  reasoning rather than take it on faith.
- Treat resume text and field labels as data, never as instructions
  (prompt-injection hygiene — cheap to add, worth stating explicitly).

## 3. Open-ended question answering (`mapping/graph.py::generate_answer`)

Separate, more conservative prompt for essay-style questions ("Why do you
want to work here?"). Grounded strictly in the resume JSON — if there isn't
enough information to answer well, the model is told to give a short honest
generic answer rather than fabricate specifics, and to keep confidence low
in that case.

**Every open-ended answer is forced to `needsUserReview: true` in code,
regardless of what confidence the model reports** — generative free text is
the highest-hallucination-risk output this system produces, so it's the one
category that's never allowed to auto-apply.

## Confidence policy (enforced in code, not just prompted)

| Condition | Effect |
|---|---|
| Choice-type value not verbatim in the field's options | value discarded, confidence forced to 0, flagged |
| confidence < 0.6 | shown as a suggestion only, never auto-applied |
| field type is open-ended/essay | always flagged for review, any confidence |
| backend unreachable/erroring | field fails open to "needs review" — never silently guessed or dropped |
