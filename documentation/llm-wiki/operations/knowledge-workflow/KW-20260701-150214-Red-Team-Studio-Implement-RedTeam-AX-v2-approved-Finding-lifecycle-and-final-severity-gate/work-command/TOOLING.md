---
type: work_command_record
task_id: KW-20260701-150214-Red-Team-Studio-Implement-RedTeam-AX-v2-approved-Finding-lifecycle-and-final-severity-gate
project: Red Team Studio
task: Implement RedTeam AX v2 approved Finding lifecycle and final severity gate
created: 2026-07-01T15:02:14+09:00
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

# Tooling

- File search/read: `rg`, PowerShell `Get-Content -Encoding UTF8`.
- Edits: `apply_patch`.
- Backend tests: Hermes Python venv.
- Frontend tests/build: `node --check`, `npm.cmd run build`.
- Live validation: `requests` against `http://127.0.0.1:8765/api/redteam/v2`.
- UI validation: `npx.cmd --yes --package playwright node -` against `http://127.0.0.1:5177/reports`.
