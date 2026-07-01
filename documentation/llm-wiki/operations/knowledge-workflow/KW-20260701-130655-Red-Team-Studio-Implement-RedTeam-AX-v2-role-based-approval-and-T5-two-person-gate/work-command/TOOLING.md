---
type: work_command_record
task_id: KW-20260701-130655-Red-Team-Studio-Implement-RedTeam-AX-v2-role-based-approval-and-T5-two-person-gate
project: Red Team Studio
task: Implement RedTeam AX v2 role based approval and T5 two person gate
created: 2026-07-01T13:06:55+09:00
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

- `rg`: search SPEC for Control Team/two-person approval requirements.
- `Get-Content -Encoding UTF8`: inspect Korean docs and current implementation.
- `apply_patch`: scoped source/test/doc edits.
- `.venv/Scripts/python.exe`: backend syntax and unittest verification.
- `npm.cmd run build`: frontend build verification.
- `Invoke-RestMethod`: live T5 API hard-gate smoke.
- Playwright via `node -e`: live UI role-display smoke.

Output summary:

- v2 API tests: 10 OK.
- sample E2E: 1 OK.
- v1 regression: 2 OK.
- Vite build: OK with existing chunk warning.
- live T5 hard gate: passed.

