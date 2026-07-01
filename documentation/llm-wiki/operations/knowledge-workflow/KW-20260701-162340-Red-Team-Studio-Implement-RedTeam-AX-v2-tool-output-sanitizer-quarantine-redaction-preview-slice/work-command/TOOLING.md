---
type: work_command_record
task_id: KW-20260701-162340-Red-Team-Studio-Implement-RedTeam-AX-v2-tool-output-sanitizer-quarantine-redaction-preview-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 tool output sanitizer quarantine redaction preview slice
created: 2026-07-01T16:23:40+09:00
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

- `rg`: locate sanitizer/guardrail requirements and implementation points.
- `Get-Content -Encoding UTF8`: inspect Korean SPEC safely.
- `apply_patch`: scoped edits.
- Python `.venv`: compile and unittest verification.
- `node --check`: frontend syntax guard.
