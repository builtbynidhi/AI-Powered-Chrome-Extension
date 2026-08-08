# Recruiter Summary

## Workday Autofill Assistant

This project is a Manifest V3 Chrome extension plus a stateless FastAPI AI
backend. It parses PDF/DOCX resumes into structured profiles, detects dynamic
Workday application steps, discovers fields semantically, maps deterministic
contact fields locally, and uses Gemini through LangChain/LangGraph only for
ambiguous fields and open-ended questions.

The automation supports text inputs, native/custom dropdowns, segmented dates,
radio/checkbox controls, file uploads, and repeatable-section primitives. It
uses React-compatible events, bounded retries, readback checks, Workday-side
validation state, and MutationObserver-based SPA settling.

Safety is enforced in code: prefilled values are preserved; uncertain and
generated answers require review; unresolved or failed fields block guarded
forward navigation; authentication controls are excluded; and final submission
requires an explicit user checkbox and click.

The repository contains TypeScript unit tests, Python API/policy tests, a static
Workday fixture contract, a Selenium built-extension smoke test with an explicit
ChromeDriver capability preflight, architecture documentation, prompting
strategy, limitations, and a demo script.
