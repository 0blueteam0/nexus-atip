# Tool Decision

## Selected Tools

- `rg`: fast source search for RedTeam AX plan/spec/code references.
- PowerShell `Get-Content -Encoding UTF8`: targeted file inspection with line numbers.
- `apply_patch`: scoped code and document edits.
- `node --check`: JavaScript syntax validation.
- `unittest`: FastAPI router and sample E2E regression.
- `npm.cmd run build`: Vite frontend build validation.
- `knowledge_workflow.py`: evidence session start/close gate.

## Rationale

The missing requirement was not another parser implementation. Existing backend code already supported strict workspace file import by path and hash. The gap was browser multipart transport and UI wiring. A thin multipart endpoint minimizes behavioral risk by reusing the already-tested `import_tool_run_file()` policy, schema validation, artifact persistence, and agent parser path.

## Rejected Alternatives

- Directly parse uploaded bytes in the route: rejected because it would bypass the established strict import path and duplicate policy checks.
- Store uploaded files outside the project workspace: rejected because `resolve_workspace_source_path()` intentionally requires local workspace files.
- Treat uploaded output as instructions for the LLM: rejected by RedTeam AX trust policy.
