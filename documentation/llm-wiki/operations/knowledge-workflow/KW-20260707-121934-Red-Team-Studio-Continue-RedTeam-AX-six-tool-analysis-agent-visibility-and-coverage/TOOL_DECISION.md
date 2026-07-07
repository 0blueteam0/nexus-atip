# Tool Decision

- Used SPEC files as source of truth for Agentic RAG/tool result handling because the user marked Agentic RAG as canonical.
- Used targeted `rg` and `Get-Content -Encoding UTF8` for Korean source inspection.
- Used `apply_patch` for controlled edits.
- Used focused pytest to verify the affected API contract without claiming full suite completion.
- Used frontend sanity scripts to protect Korean UX and safety wording.
