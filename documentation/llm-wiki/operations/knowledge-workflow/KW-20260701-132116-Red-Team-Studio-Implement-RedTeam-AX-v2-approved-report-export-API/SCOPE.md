---
type: scope
task_id: KW-20260701-132116-Red-Team-Studio-Implement-RedTeam-AX-v2-approved-report-export-API
project: Red Team Studio
task: Implement RedTeam AX v2 approved report export API
created: 2026-07-01T13:21:16+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Describe the user's request as an operational task.

## Included

- 

## Excluded

- Only explicitly excluded items belong here. Default is include.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
|  |  |  |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
|  |  |  |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
## 2026-07-01 Slice 7 Scope Update

- Project: Red Team Studio / RedTeam AX v2.
- Task: implement final report export approval gate.
- In scope:
  - Backend report export approval API.
  - Backend report export manifest API.
  - Gate rules: export is blocked unless report validation is pass, unsupported claim count is 0, unapproved high-risk count is 0, findings without evidence count is 0, and Executive Sponsor approval exists.
  - API/sample E2E regression tests.
  - FINAL_PLAN status update.
- Out of scope for this slice:
  - Real SSO/auth provider identity binding.
  - Full starter-pack/security release regression.
  - Expanded Volkis campaign timeline renderer.
