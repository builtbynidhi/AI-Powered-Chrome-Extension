# Architecture

## Components

```
Workday page (*.myworkdayjobs.com)
  └─ content script (isolated world)
       Navigator ──> classifies current step from visible DOM text
       Parser    ──> builds FieldDescriptor[] for the current step's fields
       Mapper    ──> heuristics (client-side) + backend AI (unresolved fields)
       Filler    ──> writes values into the DOM, verifies, retries
       Panel     ──> React UI in a shadow root: review rows, confidence, Submit gate
  └─ background service worker ── sole network egress point
       │  chrome.runtime messages in, fetch() to backend out
       ▼
Python FastAPI backend (localhost:8000, stateless)
       resume_parser  ── PDF/DOCX text extraction + LangChain structured extraction
       mapping        ── LangGraph: map_fields -> flag_for_review -> END
```

No database: the assignment doesn't require persistence, so the parsed resume
JSON and the original file both live in `chrome.storage.local` only. See
`limitations.md` for what a production version would add.

## Why a background-worker-only network boundary

The content script (which touches the Workday page and reads resume data)
never calls `fetch()` itself. Every AI call goes through
`chrome.runtime.sendMessage` to the background service worker, which is the
only place that talks to the backend. One place to audit for "does this ever
leave the browser," and the API key never has to exist anywhere near the
content script.

## Navigator: step detection without a linear sequence

Workday is a client-routed SPA — no URL change between steps — and different
tenants order/skip steps differently (`stepDetectors.ts`'s `KNOWN_STEPS` is a
display/UI concept, not an assumed sequence). `Navigator.ts` instead:

1. Watches `document.body` with a `MutationObserver`.
2. Waits for a mutation burst to go quiet (`mutationDebouncer.ts`, 400ms) —
   or a 15s hard timeout, so a stuck page doesn't hang forever.
3. On settle, scores visible headings/legends against each known step's
   regex signatures (`stepDetectors.ts`) and picks the best match, or
   `Unknown` if nothing scores above threshold.

## Parser: label resolution priority (the "no hardcoded selectors" constraint)

`FieldParser.ts` resolves each field's label in this order, and never falls
back to CSS class names (Workday's classes are generated/hashed and change
across releases):

`data-automation-id` → `aria-label`/`aria-labelledby` → `<label for>` /
wrapping `<label>` → `<legend>` → `placeholder` → nearest-preceding-text
proximity (last resort, depth-capped).

Widget-specific handling lives in `parser/widgets/`:
- **segmentedDate.ts** — merges a month/day/year triplet into one logical
  `date-segmented` field (never 3 orphan fields — ambiguous across every
  date on the page otherwise).
- **customListbox.ts** — Workday dropdowns are rarely native `<select>`;
  options often aren't in the DOM until the trigger is clicked, so they're
  marked `optionsLoadStrategy: "lazy"` and discovered at fill time.
- **pillChoice.ts** — pill-styled radio/checkbox groups are read via
  `role`/`aria-checked`, never visual class names.
- **nativeChoice.ts** — some Workday tenants render simple Yes/No questions
  as plain native `<input type=radio>` grouped by shared `name`, not the ARIA
  pill pattern above (found via real-world testing against a live posting).
  Grouped and filled the same way, verified via the native `.checked`
  property instead of `aria-checked`.

Field discovery is scoped to the nearest semantic landmark
(`[role="main"]` → `<main>` → `<form>` → `document.body` as a last resort),
not the whole page — also found via real-world testing: scanning the entire
page surfaced header/nav chrome (e.g. an account "Settings" menu) as if it
were an application field.
- **fileUpload.ts** — the real `<input type=file>` is usually hidden behind
  a styled dropzone.
- **repeatableSection.ts** — "Add Another" is exposed as one meta-field;
  once Filler clicks it, the newly-mounted instance's own inputs are just
  ordinary fields on the next parse pass (see the comment in that file for
  why no separate template/instance data structure is needed).

## Filler: getting a value to actually stick

Workday's frontend is React. Setting `el.value = x` directly is silently
ignored because React wraps the native setter. `reactValueSetter.ts` grabs
the *native* property setter off the prototype, calls that, then dispatches
`input` → `change` → `blur` (Workday's own validation is often blur-triggered).

Every set goes through `verify.ts`'s `setAndVerify`: apply, read back, retry
with backoff (150/400/900ms) up to 3 times. After a successful set, it also
reads Workday's own inline validation state (`aria-invalid` +
`aria-describedby`/nearby `[role=alert]` text) — this is what "validate
inputs before submission" means literally, not just our own readback check.

Fields already filled (`isPrefilled`, detected at parse time) are skipped by
default and shown as "kept" — never silently overwritten.

## Mapper: heuristics first, AI only for what's actually ambiguous

`mapper/heuristics.ts` resolves common fields (name, email, phone, links)
entirely client-side against a label-alias table — zero network calls,
confidence 1.0. Only unresolved fields (custom questions, ambiguous labels,
open-ended answers) are batched **per visible step** to the backend's
`/mapping/map-fields` endpoint.

The backend's `services/mapping/graph.py` runs a 3-node LangGraph
(`map_fields` → confidence branch → `flag_for_review` → `END`). The policy
that actually decides what gets auto-applied lives in `heuristics.py`
(backend-side, despite the name — it's the mirror of the client-side
heuristics file, but its job is *validating AI output*, not resolving
fields): a listbox/pill value not verbatim in the field's known options is
discarded and flagged; confidence < 0.6 is a suggestion only; every
open-ended/essay answer is *always* flagged for review regardless of model
confidence. These are hard rules in code — never trusted to the model.

## The no-auto-submit gate

`SubmitGate.tsx` is the only UI path that can trigger a real Workday
submission, and `AutofillController.submit()` re-checks, in code, that:
1. every non-Review step the user has visited has been through at least one
   Autofill run (`reviewedSteps`),
2. no step recorded a Workday-side validation error, and
3. the user has explicitly checked the confirmation box (a real click
   listener — no AI/mapper response can set this).

All three must hold before the controller will even look for Workday's
Submit button. This is enforced in `AutofillController.ts`, not just in the
panel's UI copy.
