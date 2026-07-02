---
type: work_command_record
task_id: KW-20260702-101527-Red-Team-Studio-Implement-RedTeam-AX-v2-ephemeral-container-launcher-gated-dry-run-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 ephemeral container launcher gated dry-run slice
created: 2026-07-02T10:15:27+09:00
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

Validation commands:
- `python -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`
- `python -m unittest tests.test_redteam_v2_sample_e2e`
- `node --check projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- `npm.cmd run build`
- `python projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_plan_contract.py`

Runtime commands intentionally not executed:
- Docker/Podman live run.
- Scanner active execution.
- Package manager install.

Dry-run controls:
- `REDTEAM_AX_CONTAINER_RUNNER_DRY_RUN=1`
- payload `container_dry_run=true`
