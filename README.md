# Workday Autofill Assistant

AI-powered Chrome extension (Manifest V3) that autofills Workday job
applications from a resume, using semantic field mapping rather than
hardcoded selectors. Built for Hidani Tech's take-home assignment.

- **`extension/`** — the Chrome extension (React + Tailwind + TypeScript).
  Modular Navigator/Parser/Filler/Mapper architecture — see
  `docs/architecture.md`.
- **`backend/`** — minimal, stateless Python FastAPI service. LangChain for
  resume parsing, LangGraph for AI-driven field mapping — see
  `docs/ai-prompting-strategy.md`.
- **`test-harness/`** — optional fixture-based test setup (see its README
  for what's automated and what isn't).
- **`docs/`** — `setup.md` (run it), `architecture.md`, `ai-prompting-strategy.md`,
  `limitations.md`, `demo-script.md`.

Start with `docs/setup.md`.

## Recruiter-ready verification

The project includes automated extension, backend, fixture, safety-policy,
and production-build checks. See `docs/test-report.md` for exact commands and
results, and `docs/recruiter-summary.md` for a concise project overview.

Create a sanitized submission archive with:

```bash
bash scripts/package-recruiter.sh
```
