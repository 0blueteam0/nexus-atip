---
type: work_command_record
task_id: KW-20260701-162831-Red-Team-Studio-Implement-RedTeam-AX-v2-frontend-sanitizer-preview-UX-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 frontend sanitizer preview UX slice
created: 2026-07-01T16:28:31+09:00
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

- Slice 20 done: RedTeam2 sanitizer preview UI foundation.
- Main UI pieces:
  - Raw tool output textarea
  - Guardrail fixture loader
  - Sanitizer Preview button
  - Decision/score/redaction cards and table
  - Sanitized output preview
- Restart 8765 backend before live browser smoke.
  - evidence_command=`Invoke-RestMethod /api/redteam/v2/tool-runs/{run_id}/sanitize-preview`
  - observed_result=`HTTP 404 from currently running 8765 backend`
  - source_path=`runtime/redteam_v2_api_router.py`
  - regression_command=`python -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`
  - regression_exit_code=0
