# Tool Decision

- PyMuPDF renders PDF first pages to PNG previews.
- pytest verifies the public preview API and existing FDS coverage contracts.
- A vision check inspected one rendered preview only as a sanity check; visual appearance is not treated as proof of authenticity.
- No marker-pdf install was used; `uv run --with pymupdf` kept dependencies isolated.

updated_at: 2026-06-07T23:31:31
