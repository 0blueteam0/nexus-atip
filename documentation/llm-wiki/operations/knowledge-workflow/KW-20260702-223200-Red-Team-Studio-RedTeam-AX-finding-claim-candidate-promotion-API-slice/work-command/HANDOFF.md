---
type: work_command_record
task_id: KW-20260702-223200-Red-Team-Studio-RedTeam-AX-finding-claim-candidate-promotion-API-slice
project: Red Team Studio
task: RedTeam AX finding claim candidate promotion API slice
created: 2026-07-02T22:32:00+09:00
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

## Current Implementation

New endpoints:

- `GET /api/redteam/v2/tool-result-finding-claim-review`
- `POST /api/redteam/v2/tool-result-finding-claim-review/{candidate_id}/promote-finding`

The POST endpoint reads the latest review package, selects the candidate, verifies backend Evidence approval, and then calls `create_finding()` only when approved. Otherwise it returns `status=blocked`.

## Validation Evidence

- `pytest tests/test_redteam_v2_api_router.py -q`: 54 passed
- `redteam_ax_accepted_gate_manifest.py`: 24/24 passed

## Next Actions

Use approved Evidence Cards from actual tool outputs, call promotion for each candidate, then complete severity approvals and report validation.
