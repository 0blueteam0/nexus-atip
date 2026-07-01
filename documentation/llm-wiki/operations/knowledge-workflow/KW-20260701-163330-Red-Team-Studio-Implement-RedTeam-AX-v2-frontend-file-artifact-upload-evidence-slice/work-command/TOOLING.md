# Work Command Tooling

## Commands Used

- `rg`: located plan/spec/code references for upload, artifact, SHA-256, sanitizer, and parser.
- `Get-Content -Encoding UTF8`: inspected Korean and mixed UTF-8 source files with line numbers.
- `apply_patch`: changed source and documentation files.
- `node --check`: verified frontend JavaScript syntax.
- `npm.cmd run build`: verified Vite production build.
- `.venv\Scripts\python.exe -m unittest`: verified RedTeam AX v2 API router and sample E2E.
- `knowledge_workflow.py close`: enforced evidence session gate.
- `handoff.ps1`: generated provider and system handoff records.

## Tooling Notes

- Broad root `rg` over `projects/ai-agentic-soc` produced too much vendor/static output, so subsequent searches were scoped to runtime, tests, reports.js, and SPEC/FINAL_PLAN.
- FastAPI multipart support was verified through TestClient. The installed environment has the required multipart support because the new route imported and the test passed.
- Vite build completed with an existing large chunk warning only; no build failure.
