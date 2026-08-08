from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import mapping, resume

app = FastAPI(title="Workday Autofill Backend", version="0.1.0")

# Dev-only, intentional: a Chrome extension's background worker calls this
# over plain localhost HTTP. See docs/architecture.md for why native
# messaging was judged disproportionate for this scope.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"chrome-extension://.*",
    allow_methods=["POST"],
    allow_headers=["*"],
)

app.include_router(resume.router)
app.include_router(mapping.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
