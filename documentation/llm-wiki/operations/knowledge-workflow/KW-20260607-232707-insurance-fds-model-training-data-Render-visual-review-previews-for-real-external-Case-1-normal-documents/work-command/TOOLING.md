# Tooling

- PyMuPDF: PDF first-page rendering and text extraction.
- pytest: TDD verification.
- vision_analyze: spot-check of one rendered PNG as document-like preview.
- skill_manage: patched reusable OCR/document reference with preview gate.

The preview pipeline runs through `uv run --with pymupdf` to avoid persistent dependency changes.
updated_at: 2026-06-07T23:32:03
