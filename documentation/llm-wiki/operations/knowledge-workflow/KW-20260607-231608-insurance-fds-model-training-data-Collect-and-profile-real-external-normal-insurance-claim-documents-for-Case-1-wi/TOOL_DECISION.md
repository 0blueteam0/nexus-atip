# Tool Decision

- Python collector script used for deterministic provenance/hash manifest creation.
- urllib used for external downloads to avoid browser-only manual state.
- PyMuPDF used opportunistically through `uv run --with pymupdf` for page/text profiling.
- pytest used for TDD contract verification.
- Generated/synthetic documents are explicitly forbidden in manifest schema.

updated_at: 2026-06-07T23:22:25
