---
type: scope
task_id: KW-20260703-015606-Red-Team-Studio-RedTeam-AX-operating-closure-submission-package-and-approver-readiness-slice
project: Red-Team-Studio
task: RedTeam AX operating closure submission package and approver readiness slice
created: 2026-07-03T01:56:07+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

RedTeam AX v2의 실제 운영 closure 직전 단계에서 scanner 명령을 실행하지 않고 `source_dir`, 승인자 4명, runtime blocker, close-operating API payload를 검증하는 제출 패키지를 추가한다.

## Included

- Backend API: `/api/redteam/v2/toolchains/operating-closure-submission-package`
- Frontend RedTeam2 report studio control/copy/status rows for the submission package
- Regression tests and Korean copy sanity anchors
- Completion audit, Detailed_PLAN, FINAL_PLAN, and LLM Wiki updates

## Excluded

- Real external scanner execution against customer or organizational infrastructure
- Claiming final RedTeam AX goal completion before real operator artifacts and human approver evidence exist

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| backend | Prepare non-executing closure submission package and persist metadata | `runtime/redteam_v2_models.py`, router endpoint |
| frontend | Add Korean UI action and result tables for RedTeam2 closure package | `reports.js` |
| verification | Add and run targeted regression, router suite, copy inventory, plan/audit gates, accepted gate | pytest/sanity outputs |
| documentation | Update completion audit, plans, and LLM Wiki call rules | `Detailed_PLAN.MD`, `FINAL_PLAN.md`, wiki/audit files |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| API implementation | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py` | Build submission package and close API payload without command execution |
| API route | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py` | Expose frontend/backend contract |
| Regression test | `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | Prove missing approvers block and complete approvers prepare close payload |
| UI contract | `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | Add Korean operator workflow |
| Accepted gate manifest | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | Prove accepted gates pass |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| API compiles | `py_compile` exit_code 0 |
| Frontend method compiles | `node --check` exit_code 0 |
| Focused regression passes | `pytest -k operating_closure_submission_package` exit_code 0 |
| Full router suite passes | `pytest tests/test_redteam_v2_api_router.py -q` exit_code 0 |
| Accepted gates pass | accepted manifest status `passed`, 24/24 gates |
| Knowledge gate closed | `QUALITY_GATE_RESULT.json` status `passed` |

## Completion Definition

This slice is complete only when the non-executing submission package API, UI, tests, audit/wiki updates, knowledge workflow close gate, handoff, commit, and push are complete. The overall RedTeam AX goal remains active until real operator folders, real approver review, and final closure evidence are proven.