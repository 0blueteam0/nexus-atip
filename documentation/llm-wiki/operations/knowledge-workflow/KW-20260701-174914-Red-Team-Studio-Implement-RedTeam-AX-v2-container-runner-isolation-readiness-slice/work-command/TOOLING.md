---
type: work_command_record
task_id: KW-20260701-174914-Red-Team-Studio-Implement-RedTeam-AX-v2-container-runner-isolation-readiness-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 container runner isolation readiness slice
created: 2026-07-01T17:49:14+09:00
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

Commands used:
- `rg` for targeted code/spec/plan search.
- `Get-Content -Encoding UTF8` for Korean-safe inspection.
- `apply_patch` for source edits.
- `python -m unittest discover -s tests -p "test_redteam_v2_api_router.py"` for API regression.
- `python -m unittest tests.test_redteam_v2_sample_e2e` for sample E2E.
- `node --check .../reports.js` for JS syntax.
- `npm.cmd run build` for frontend build.
- `python .../test_plan_contract.py` for plan sanity.

Tools intentionally not used by the implementation:
- Docker.
- Nuclei/OpenVAS/Trivy/ZAP active execution.
- package manager install commands.
- shell-expanded runner commands.
