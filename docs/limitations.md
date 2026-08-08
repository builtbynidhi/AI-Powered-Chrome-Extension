# Limitations

Honest accounting of what this deliberately does and doesn't cover, and why.

Resume content is stored in `chrome.storage.local` and sent to the configured
local backend/Gemini provider for parsing and ambiguous-field mapping. Users
should use their own API key, avoid shared browser profiles, and clear the
stored resume after use. No resume or API key is included in the recruiter ZIP.

## Scope cuts made explicitly for this assignment (not oversights)

- **No database.** The assignment never requires persistence; resume JSON and
  the raw file live in `chrome.storage.local` only. A production version
  would add Postgres for a saved-profile/application-history feature.
- **No cloud deployment.** Backend runs on `localhost:8000`. CORS is
  deliberately relaxed to `chrome-extension://*` over plain HTTP — fine for
  a local dev/demo tool, not how a hosted version would be secured.
- **Single LLM provider (Gemini free tier).** `llm_client` usage goes through
  LangChain's provider abstraction, so swapping to OpenAI/Anthropic is a
  one-line config change, but only Gemini was actually tested end-to-end.
- **No live multi-tenant Selenium regression suite.** Automatically driving
  real applications through NVIDIA/Remitly/PNC/Netflix's actual production
  auth and recruiting pipelines would mean (a) submitting synthetic test
  data into a real company's applicant tracking system on every run, and
  (b) risking bot-detection flags on a residential IP right before needing
  a working demo. Manual, deliberate, human-supervised testing was used
  instead — see `test-harness/README.md` for the fixture-based alternative
  that was attempted, and the automation-environment issue that made even
  that unreliable in this particular sandbox.

## Real engineering limitations (not scope cuts)

- **The phone dial-code table (`heuristics.ts::DIAL_CODES`) covers ~10
  common countries.** For a country not in it, the heuristic deliberately
  leaves the phone number unchanged rather than guessing a calling-code
  length wrong — meaning a "Phone Number" field paired with a separate
  "Country Phone Code" selector may still end up with the full
  `+<code>...` number for those countries, which some Workday tenants reject.
- **Step detection is signal-based, not guaranteed.** `stepDetectors.ts`
  scores known step signatures against visible heading/legend text. A
  tenant that phrases a step's heading unusually, or a step with no
  supported heading text, will classify as `Unknown` rather than a wrong
  guess — safer, but means that tenant's fields won't be parsed until a new
  signature is added.
- **When a choice field's options don't include the resume's actual best
  answer** (e.g. a "Highest education" dropdown missing "Master's Degree"),
  the model correctly avoids inventing an out-of-list value but doesn't
  reliably flag that the *option list itself* was incomplete — it picks the
  closest verbatim option at a high confidence that auto-applies rather than
  being surfaced for review. Verified against a real case during testing
  (resume: Master's degree; options: High School/Associate/Bachelor's/
  Doctorate → model chose "Bachelor's" at 0.85 confidence). A production
  version would add a heuristic check comparing the chosen option's apparent
  "rank" against the resume fact to force review when they look mismatched.
- **Custom listbox matching is text-based** (exact → normalized →
  substring). A dropdown with many visually similar options (e.g. a long
  list of near-identical university names) could occasionally match the
  wrong one; the confidence/review flow is the safety net, not a guarantee
  the first automated match is always correct.
- **Segmented date grouping assumes a 3-input month/day/year pattern**
  reachable within a shallow common-ancestor search. A tenant using a native
  `<input type=date>` instead is handled by the plain text-input path
  instead (untested against a real example of that variant).
- **Repeatable sections are filled one entry at a time.** The controller scopes
  mapping to the current resume experience/education entry, clicks one verified
  Add control when another entry remains, waits for the normal SPA reparse, and
  continues on the next user-triggered Autofill pass. Modal-only tenant variants
  that do not mount ordinary fields remain unsupported.
- **File upload via `DataTransfer`/`input.files` assignment** is the standard
  technique for scripted file input, but some browser/Workday version
  combinations validate uploads more strictly (e.g. requiring an actual
  user-gesture-triggered native file picker) — not verified against every
  example posting.
- **Some Workday composite controls expose hidden internal values.** These may
  appear as preserved duplicate rows in the review panel. They are never
  overwritten, but future tenant-specific parser refinement could hide them
  from the panel for a cleaner presentation.
- **No CAPTCHA/bot-detection handling**, by design — if a Workday tenant
  challenges the session, the extension does nothing to work around it
  (matches the "must not bypass authentication" constraint by construction,
  but also means those tenants may simply not be autofillable).
- **The Vitest suite covers Parser/heuristics logic directly**; it does not
  cover the Filler's actual DOM-mutation behavior against a live Workday
  page (that's what the one supervised real-posting run + demo video is
  for), since faithfully reproducing Workday's React internals in a unit
  test isn't practical in the time available.
