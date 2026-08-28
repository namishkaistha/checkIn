"""FastAPI application entrypoint.

This module is the **composition root** — not a layer of the architecture.
Its only job is to wire the app: build the FastAPI instance, attach CORS,
mount routers. All domain logic lives downstream in routes/ and services/.
"""
from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Local dev: read backend/.env if present. In prod (Vercel), env vars come
# from the platform and this is a no-op.
load_dotenv()

# Import models so SQLAlchemy registers them with Base.metadata before any
# create_all() call runs (tests build the schema this way).
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
    allow_methods=["GET", "POST"],  # tight allowlist — we never DELETE/PUT
    allow_headers=["Content-Type"],
)

# On Vercel we deploy behind `/api/*` (see repo-root vercel.json). Set
# API_PREFIX=/api there so all routes get the prefix at inclusion time.
# Local dev and tests leave it unset, so the routes stay at their bare
# paths (/users, /check-ins) — no test churn.
_api_prefix = os.environ.get("API_PREFIX", "")

_api_router = APIRouter()
_api_router.include_router(users_routes.router)
_api_router.include_router(check_ins_router)


@_api_router.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(_api_router, prefix=_api_prefix)
