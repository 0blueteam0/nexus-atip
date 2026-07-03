---
type: work_command_record
task_id: KW-20260703-143824-Red-Team-Studio-RedTeam-AX-next-six-tool-operating-workflow-continuation
project: Red-Team-Studio
task: RedTeam AX next six-tool operating workflow continuation
created: 2026-07-03T14:38:24+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Used

- `rg` and `Get-Content`: source location and context inspection.
- `apply_patch`: scoped source, test, document edits.
- `./.venv/Scripts/python.exe`: compile, unittest, sanity checks.
- `node --check`: frontend syntax check.
- FastAPI TestClient: goal completion review status.

## Not Used

Actual scanner tools, Docker, WSL, and network scans were not used for this slice because the new feature is a work order guide, not real tool execution.

## Reuse

When adding more RedTeam2 workflow guidance, keep no-execution flags in API responses and add matching frontend contract sanity terms.

## Tool Need

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|

## Build vs Adopt

## Selected Tool

## Verification
