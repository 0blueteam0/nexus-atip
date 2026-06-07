# Tooling

Commands used:

- pytest via `uv run --with pytest` for TDD verification.
- PyMuPDF via `uv run --with pymupdf` for PDF profiling without altering the Hermes environment.
- Python standard library urllib for deterministic downloads.
- knowledge_workflow.py for evidence gate.

Tooling rationale:
- `uv --with` keeps PyMuPDF dependency isolated and avoids persistent environment conflicts.
- The collector avoids generated artifacts by using external URL downloads only.

updated_at: 2026-06-07T23:23:07
