---
type: scope
task_id: KW-20260707-102717-Red-Team-Studio-Continue-RedTeam-AX-tool-execution-and-analysis-integration
project: Red Team Studio
task: Continue RedTeam AX tool execution and analysis integration
created: 2026-07-07T10:27:17+09:00
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

## Filled Scope

- Backend `GET /api/redteam/v2/toolchains/execution-presets`.
- RedTeam2 frontend execution preset loader and Korean UI.
- Trivy/npm audit low-risk local runner presets only as governed runner inputs.
- Nuclei/OpenVAS/ZAP/SCA remain approval, service import, or artifact import guidance.
- This slice does not install tools, run active scans, or complete the full persistent goal.
