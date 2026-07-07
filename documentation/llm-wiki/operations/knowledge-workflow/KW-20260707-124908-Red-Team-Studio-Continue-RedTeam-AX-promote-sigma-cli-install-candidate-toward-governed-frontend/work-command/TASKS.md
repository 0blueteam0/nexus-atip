---
type: work_command_record
task_id: KW-20260707-124908-Red-Team-Studio-Continue-RedTeam-AX-promote-sigma-cli-install-candidate-toward-governed-frontend
project: Red Team Studio
task: Continue RedTeam AX promote sigma-cli install candidate toward governed frontend execution
created: 2026-07-07T12:49:08+09:00
source_package: K:/wiki/work command
---

# TASKS

## Original Request
Continue the active RedTeam AX objective: discover/install redteam tools, wire installed tools to frontend buttons, collect results, and preserve ROE/HITL/Evidence governance.

## Task
Promote Sigma CLI from discovered install candidate to optional governed local runner profile. Verify actual install, add local rule validation preset, normalize results, and keep required six-tool coverage unchanged.

## Status
Completed for this slice. Sigma CLI is installed in `.venv`, `sigma version` and `sigma check` work, backend profile/preset/normalizer/agent were added, and targeted tests passed. Full RedTeam AX goal remains active.

## Execution Control
Only local rule validation was executed. No plugin install, remote rule download, SIEM deployment, active scan, exploitation, endpoint collection, or cloud execution was performed.

## Tools
Used pip install in project `.venv`, Sigma CLI, apply_patch, pytest, Python compile, Node syntax check, frontend sanity scripts, and knowledge workflow gate.

## Verification
Verified Sigma version 3.0.3, local rule check with 0 errors/issues, governed toolchain execution/collection smoke, targeted backend regression, and frontend sanity.
