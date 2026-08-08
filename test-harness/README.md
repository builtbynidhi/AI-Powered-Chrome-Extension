# Test harness (optional, per the assignment's "Secondary (Optional): Selenium" note)

## What's here

- `fixtures/` — hand-authored, sanitized static HTML capturing Workday's key DOM
  patterns (data-automation-id labeling, segmented date, pill radiogroup) so
  automation logic can be exercised without touching a live employer site.
- `conftest.py` / `tests/test_extension_injection.py` — a Selenium+pytest smoke
  test that serves a fixture over `http://127.0.0.1` (matched in
  `manifest.config.ts`'s content_scripts, a dev/test-only convenience) and
  loads the real built `extension/dist` via `--load-extension`.

## Known limitation

In this development environment, launching Chrome via Selenium with
`--load-extension` did not reliably activate the unpacked MV3 extension
(`chrome://extensions` loads, but the extension's content script did not
inject on the fixture page within a reasonable wait, in both headless and
non-headless runs). This looks like an automation/sandboxing quirk of driving
Chrome extension loading through Selenium in this particular setup, not a
bug in the extension itself — the exact same `dist/` build, loaded normally
via `chrome://extensions` → "Load unpacked", is what's used for the real
manual testing in `docs/limitations.md` and the demo video.

Given the assignment explicitly marks Selenium as **secondary/optional**, and
given the primary scoring criteria (automation correctness, AI mapping
accuracy) live in the extension itself, this was not worth further time
against — the test file and fixture are left in place as a starting point,
and the actual test coverage for the Parser/Mapper logic lives in
`extension/tests/*.test.ts` (Vitest + jsdom), which runs reliably and tests
the same real code (`FieldParser.ts`, `heuristics.ts`) directly:

```bash
cd extension && npm test
```

## Running the Selenium smoke test yourself

The harness checks `chrome://extensions` before testing injection. If the
installed Chrome/ChromeDriver ignores `--load-extension`, pytest reports an
explicit skip with the browser version; manual load-unpacked verification is
then required.

```bash
cd test-harness
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
(cd ../extension && npm run build)
pytest tests/ -v
```
