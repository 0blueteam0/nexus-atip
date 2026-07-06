# Tool Decision

- `rg` was used to locate remaining RedTeam2 environment/internal operation vocabulary.
- `apply_patch` was used for scoped frontend, sanity, and documentation edits.
- Playwright via local Node script was used to capture rendered DOM and screenshots before and after the change.
- Python sanity contracts were used for project-specific regression checks.
- JSON completion audit was updated through a parser to avoid corrupting structured data.
- Vite dev server was started only for browser verification and will be stopped before final response.
