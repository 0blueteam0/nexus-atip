---
type: work_command_record
task_id: KW-20260701-160449-Red-Team-Studio-Implement-RedTeam-AX-v2-tool-specific-output-normalizers-slice
project: Red Team Studio
task: Implement RedTeam AX v2 tool-specific output normalizers slice
created: 2026-07-01T16:04:49+09:00
updated: 2026-07-01T16:18:00+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

Patch parser logic, run tests, run live API smoke, update plan and evidence.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| `apply_patch` | edit | Scoped diffs | None material | used |
| `.venv` Python | test | FastAPI dependencies available | Need correct working directory | used |
| live API smoke | runtime check | Confirms artifact output | Requires server restart | used |
| npm build | frontend | Not needed for backend-only change | Extra time | skipped; node syntax check OK |

## Build vs Adopt

No new tools built. Parser helpers are in existing model module for this slice.

## Selected Tool

`.venv` Python and live 8765 API.

## Verification

All selected commands exited 0.
