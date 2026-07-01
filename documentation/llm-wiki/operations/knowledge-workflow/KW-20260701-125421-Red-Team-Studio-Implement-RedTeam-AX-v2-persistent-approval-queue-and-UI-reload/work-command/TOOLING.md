---
type: work_command_record
task_id: KW-20260701-125421-Red-Team-Studio-Implement-RedTeam-AX-v2-persistent-approval-queue-and-UI-reload
project: Red Team Studio
task: Implement RedTeam AX v2 persistent approval queue and UI reload
created: 2026-07-01T12:54:21+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|

## Build vs Adopt

## Selected Tool

## Verification

## Tooling Used

- `rg`: scoped search for SPEC and code references.
- `Get-Content -Encoding UTF8`: safe Korean file inspection.
- `apply_patch`: source/doc edits.
- `.venv/Scripts/python.exe`: backend tests and syntax check.
- `npm.cmd run build`: frontend build validation.
- `Invoke-RestMethod`: live backend smoke.
- `node -e` with Playwright: live frontend smoke and screenshot capture.

Tooling output summary:

- Backend tests passed: v2 API 7, sample E2E 1, v1 regression 2.
- Frontend build passed with only existing Vite chunk-size warning.
- Live artifacts created under `CASE-LIVE-APPROVAL-002`.

