# Test Report

Date: 2026-08-09

## Automated verification

| Area | Command | Expected result |
|---|---|---|
| Extension behavior | `cd extension && npm test` | All Vitest tests pass |
| Type safety | `cd extension && npx tsc --noEmit` | Exit code 0 |
| Production build | `cd extension && npm run build` | Manifest V3 build in `extension/dist` |
| Backend | `cd backend && .venv/bin/pytest tests -v` | All tests pass without live AI calls |
| Fixture contract | `test-harness/.venv/bin/pytest test-harness/tests/test_fixture_contract.py -v` | Pass |
| Selenium smoke | `test-harness/.venv/bin/pytest test-harness/tests/test_extension_injection.py -v` | Pass when ChromeDriver loads unpacked extensions; otherwise explicit versioned skip |

Latest automated result: 45/45 extension tests and 9/9 backend tests pass.
The fixture/Selenium harness reports one fixture pass and one explicit skip on
Chrome 151 because ChromeDriver ignores the unpacked-extension argument.

## Boundaries

Automated tests never submit a real job application and never make live Gemini
calls. A supervised manual Workday test is required because tenant markup,
authentication, and Chrome unpacked-extension policy vary by environment.

## Live AI verification

Two distinct one-page PDF resumes were parsed through the configured Gemini
provider. Both returned non-empty required identity fields plus structured
experience, education, and skills. A constrained choice mapping returned a
valid allowed option/review result, and the dedicated open-ended answer path
returned a non-empty answer with `needsUserReview=true`. Resume text, identity
values, and generated answers were not written to this report.

## Supervised Workday verification

A live Remitly Workday tenant was tested manually in Chrome. The production
extension injected successfully, ignored the non-application job-search page,
detected My Information and Application Questions, preserved valid account
values, and surfaced a resume-unsupported source question as a review-required
suggestion rather than guessing. Live testing also found and fixed regressions
for non-application search fields and `Select One` placeholders.

The original tenant run required manual resume selection. A follow-up fix now
refreshes the cached resume at Autofill time, excludes deterministic file inputs
from AI mapping, and attaches them through the existing DataTransfer-based
filler. Automated coverage verifies the cached file name, MIME type, byte size,
bubbling input/change events, and Workday validation reporting. The production
build was regenerated successfully. A final supervised tenant click remains
required because no controllable Chrome session was available for this run;
the extension must be reloaded before retesting the My Experience step.
