---
type: work_command_record
task_id: KW-20260702-223200-Red-Team-Studio-RedTeam-AX-finding-claim-candidate-promotion-API-slice
project: Red Team Studio
task: RedTeam AX finding claim candidate promotion API slice
created: 2026-07-02T22:32:00+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Commands

- `rg` and PowerShell file reads for inspection.
- `apply_patch` for source and documentation edits.
- `python -m py_compile` for syntax verification.
- `node --check` for frontend syntax verification.
- `pytest tests/test_redteam_v2_api_router.py -q` for API regression.
- RedTeam Studio sanity scripts for frontend copy, plan, completion audit, and accepted gate.

## Non-Execution Boundary

No Docker, WSL, OpenVAS, ZAP, Nuclei, Trivy, npm audit, or active scanner command was executed by this slice. The change is API orchestration and policy enforcement only.

## Tool Need

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|

## Build vs Adopt

## Selected Tool

## Verification
