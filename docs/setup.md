# Setup

## 1. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then paste in your Gemini key (aistudio.google.com/apikey — free tier)
uvicorn app.main:app --reload --port 8000
```

Confirm it's up: `curl http://localhost:8000/health` → `{"status":"ok"}`.

## 2. Extension

```bash
cd extension
npm install
npm run build       # produces extension/dist
npm test            # runs the Vitest suite (Parser/heuristics logic)
```

Load it in Chrome:
1. `chrome://extensions`
2. Enable **Developer mode** (top right)
3. **Load unpacked** → select `extension/dist`

## 3. Use it

1. Click the extension icon → upload your resume (PDF or DOCX).
2. Navigate to a Workday application (e.g. one of the postings in the
   assignment brief) and log in / start the application yourself — the
   extension never touches Workday's login form.
3. A panel appears in the top-right corner showing the detected step and
   its fields. Click **Autofill: \<step\>**.
4. Review flagged/low-confidence fields (amber), accept or edit them.
5. On the final Review step, check every prior step shows no unresolved
   validation errors, tick the confirmation checkbox, and click **Submit
   application** — this is the only button in the whole system that can
   trigger a real Workday submission.

## Dev loop

`npm run dev` in `extension/` gives HMR for the popup/panel UI during
development (content script changes still need a manual reload of the
unpacked extension from `chrome://extensions`).
