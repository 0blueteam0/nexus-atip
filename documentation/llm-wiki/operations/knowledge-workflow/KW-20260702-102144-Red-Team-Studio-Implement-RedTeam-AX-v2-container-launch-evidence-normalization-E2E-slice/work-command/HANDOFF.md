---
type: work_command_record
task_id: KW-20260702-102144-Red-Team-Studio-Implement-RedTeam-AX-v2-container-launch-evidence-normalization-E2E-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 container launch evidence normalization E2E slice
created: 2026-07-02T10:21:44+09:00
source_package: K:/wiki/work command
---

# HANDOFF

## Original Request

## Current Interpretation

## Current State

## Decision Record

## Execution Record

## Tools And Capability

## Next Actions

# Work Command Handoff

Current slice:
- Container launch dry-run artifact now flows into agent-analyze and Evidence Card candidate creation.

Important API sequence:
- `execute-governed` returns `ContainerLaunchPrepared`.
- `POST /tool-runs/{run_id}/agent-analyze` returns `result_type=container_launch_evidence`.
- `POST /tool-runs/{run_id}/create-evidence` returns `redteam_ax_v2_evidence_candidate`.

Next implementer should add real container stdout/stderr scanner output normalization.
