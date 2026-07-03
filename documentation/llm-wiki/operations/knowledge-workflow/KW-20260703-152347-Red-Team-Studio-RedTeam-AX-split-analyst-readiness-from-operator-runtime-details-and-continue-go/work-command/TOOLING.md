---
type: work_command_record
task_id: KW-20260703-152347-Red-Team-Studio-RedTeam-AX-split-analyst-readiness-from-operator-runtime-details-and-continue-go
project: Red Team Studio
task: RedTeam AX split analyst readiness from operator/runtime details and continue governed tool execution UX
created: 2026-07-03T15:23:47+09:00
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

Local tools used:
- `rg` for source search.
- PowerShell `Get-Content -Encoding UTF8` for Korean Markdown/JS/Python inspection.
- `apply_patch` for source and documentation edits.
- `.venv/Scripts/python.exe` for Python compile and unittest/sanity checks.
- `node --check` for frontend JavaScript syntax.
- `python -m json.tool` for audit JSON validation.

No external network tooling was used. No scanner, Docker, WSL, OpenVAS, ZAP, Nuclei, Trivy, npm audit, or SCA command was executed by this slice.
