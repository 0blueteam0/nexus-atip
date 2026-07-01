---
type: work_command_record
task_id: KW-20260701-152312-Red-Team-Studio-Implement-RedTeam-AX-v2-case-scoped-RBAC-policy-slice
project: Red Team Studio
task: Implement RedTeam AX v2 case-scoped RBAC policy slice
created: 2026-07-01T15:23:12+09:00
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

- Search/read: `rg`, PowerShell `Get-Content -Encoding UTF8`.
- Edits: `apply_patch`.
- Backend validation: Hermes Python venv, `unittest`, `py_compile`.
- Frontend validation: `node --check`, `npm.cmd run build`.
- Live API validation: `requests` to `http://127.0.0.1:8765/api/redteam/v2`.
- UI validation: Playwright through `npx.cmd --yes --package playwright node -`.
