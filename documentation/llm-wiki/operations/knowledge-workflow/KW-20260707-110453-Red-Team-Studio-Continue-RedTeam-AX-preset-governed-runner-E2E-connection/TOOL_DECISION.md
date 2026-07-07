# Tool Decision

- `rg` and targeted `Get-Content -Encoding UTF8` were used for repository inspection because the project contains Korean text and large files.
- `apply_patch` was used for source and documentation edits to keep the change scoped and reviewable.
- `node --check` was used for the frontend syntax check.
- Focused `pytest -k` was used to verify the backend API contract affected by this slice without claiming full-suite completion.
- Frontend runtime and launch readiness sanity scripts were used to protect Korean UX and governed execution readiness wording.
- `git diff --check` was used to detect whitespace and patch formatting issues before commit.
