---
type: work_command_record
task_id: KW-20260701-162831-Red-Team-Studio-Implement-RedTeam-AX-v2-frontend-sanitizer-preview-UX-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 frontend sanitizer preview UX slice
created: 2026-07-01T16:28:31+09:00
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

- `rg`: locate frontend/backend points.
- `Get-Content -Encoding UTF8`: inspect source safely.
- `apply_patch`: scoped edits.
- `node --check`: frontend syntax verification.
- Python unittest: backend regression verification.
