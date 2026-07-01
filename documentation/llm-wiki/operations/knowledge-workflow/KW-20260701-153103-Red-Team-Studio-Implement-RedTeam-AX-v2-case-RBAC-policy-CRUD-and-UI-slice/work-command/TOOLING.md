---
type: work_command_record
task_id: KW-20260701-153103-Red-Team-Studio-Implement-RedTeam-AX-v2-case-RBAC-policy-CRUD-and-UI-slice
project: Red Team Studio
task: Implement RedTeam AX v2 case RBAC policy CRUD and UI slice
created: 2026-07-01T15:31:03+09:00
updated: 2026-07-01T16:25:00+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

Implement scoped source edits, run backend/frontend tests, perform live browser smoke, and close evidence workflow.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| `rg` | search | Fast local code discovery | None material | used |
| `apply_patch` | edit | Scoped, reviewable diffs | Large delete/add patch output is verbose | used |
| project `.venv` Python | test runtime | Has FastAPI dependencies | Module discovery differs from direct module path | used with `unittest discover` |
| global Python | test runtime | Easy command | Missing FastAPI | rejected |
| Playwright | browser test | Verifies actual 5177 UI | Requires project module resolution | used |
| Vite build | frontend verification | Production build signal | Existing chunk warning | used |

## Build vs Adopt

No new tooling was built. Existing project runtimes and Playwright dependency were adopted.

## Selected Tool

Project `.venv` for backend tests and npm project directory for frontend checks.

## Verification

All selected tool commands completed with exit_code 0 after correcting runtime path issues.
