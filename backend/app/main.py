"""FastAPI application entrypoint."""
from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import models so SQLAlchemy registers them with Base.metadata before any
# create_all calls happen (e.g. in tests).
from app import models  # noqa: F401
from app.routes import users as users_routes
from app.routes.check_ins import router as check_ins_router

app = FastAPI(title="Pantry Check-In API")

# CORS: comma-separated allowlist via CORS_ALLOW_ORIGINS env var. Defaults
# to the Vite dev server only — prod must set this explicitly to the
# frontend's URL. allow_credentials is False because we don't use cookies
# or Authorization headers (and "*" + credentials=True is invalid per spec).
_cors_origins = [
    o.strip()
    for o in os.environ.get(
        "CORS_ALLOW_ORIGINS", "http://localhost:5173"
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(users_routes.router)
app.include_router(check_ins_router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
