# Manager/Team Demo Script (~5 minutes, plain-language)

## 1. The problem (30s)
"Workday job applications are long, multi-step forms — name, experience,
education, screening questions — often 30+ fields across 6-7 steps. This
extension reads your resume once and fills that out automatically, using AI
to understand which resume fact goes in which field, since the field labels
never match your resume's wording exactly."

## 2. Upload & parse (30s)
Open the extension popup, upload the resume. "It just turned an unstructured
PDF into structured data — name, experience, education, skills — using an
LLM, not brittle regex parsing. That's the AI understanding step."

## 3. Autofill a real posting (90s)
Open a live Workday posting, click Autofill. "Watch — it detected which step
of the application I'm on, matched simple fields like name and email
instantly with no AI call needed, and for anything ambiguous — a custom
question, a dropdown with company-specific wording — it called an LLM,
scored its own confidence, and only auto-filled what it's sure about."

Point at one flagged, low-confidence field: "This one it's *not* filling for
me — it's showing a suggestion and asking me to confirm, because guessing
wrong on a job application is worse than not guessing at all."

## 4. The safety story (60s) — this is the part a manager cares about most
"Three things are hard-coded as non-negotiable, not just described in a
README:
- It never touches the login form — it only acts after I've logged in myself.
- It never overwrites a field that's already correctly filled.
- It cannot click the real Submit button until every step's been reviewed,
  there are no unresolved form errors, and I've personally checked a
  confirmation box. That's enforced in code, not just in the UI."

## 5. The real-world proof point (60s) — use this, it's your strongest material
"I didn't just build this against a mockup — I ran it against a live
Remitly posting today. It found and flagged a company-specific question
correctly. It also **broke** in three small ways: it picked up a page-header
button as if it were a form field, missed one plain Yes/No question that
used a different HTML pattern than the rest of the form, and put a phone
number in the wrong field. All three are now fixed, with automated tests
added so they can't silently come back. That loop — real test, real bug,
real fix, real regression test — is the actual engineering work here, not
the demo polish."

## 6. Close (30s)
"Everything in the assignment brief is implemented: resume parsing, AI field
mapping, all the Workday field types, the review/confirmation flow. What's
explicitly out of scope and why is written down in `docs/limitations.md` —
things like broader multi-tenant coverage — rather than left as a silent gap."
