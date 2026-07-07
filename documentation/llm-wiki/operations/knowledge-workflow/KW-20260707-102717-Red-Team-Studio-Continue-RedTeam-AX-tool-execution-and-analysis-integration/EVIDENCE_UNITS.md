---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-07T10:27:17+09:00
---

# Evidence Unit

## Claim

## Source

- source_type:
- path_or_url:
- command:
- exit_code:
- collected_at:

## Evidence

## Confidence

## Limits

## Related Decisions

## Filled Evidence

| id | type | evidence | result |
|---|---|---|---|
| EV-001 | source | `SPEC/27_AGENT_TOOL_ORCHESTRATION_WORKFLOW_SPEC.md`, `SPEC/28_TOOL_RESULT_EVIDENCE_AND_REPORTING_SPEC.md` | Raw output must go through normalizer, Evidence candidate, human review, matrix/report. |
| EV-002 | code | `runtime/redteam_v2_models.py` | Added `list_toolchain_execution_presets()`. |
| EV-003 | code | `runtime/redteam_v2_api_router.py` | Added `GET /toolchains/execution-presets`. |
| EV-004 | code | `reports.js` | Added `applyRedTeam2ExecutionPresets()` and Korean preset UI. |
| EV-005 | test | selected pytest | 2 passed, 87 deselected, exit_code=0. |
| EV-006 | sanity | frontend runtime/launch contracts | Both passed. |

