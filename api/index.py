"""Vercel Python entrypoint.

Vercel treats every file under /api as a serverless function. It imports the
module and looks for a WSGI/ASGI app named `app`. This file just re-exports
the FastAPI app from the backend package so all the domain code stays in
backend/ and nothing gets duplicated.
"""
import os
import sys

# Make backend/ importable — Vercel's build sandbox runs from the repo root.
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(_ROOT, "backend"))

from app.main import app  # noqa: E402, F401
