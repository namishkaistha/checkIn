"""FastAPI application entrypoint."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import models so SQLAlchemy registers them with Base.metadata before any
# create_all calls happen (e.g. in tests).
from app import models  # noqa: F401
from app.routes import users as users_routes
from app.routes.check_ins import router as check_ins_router

app = FastAPI(title="Pantry Check-In API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_routes.router)
app.include_router(check_ins_router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
