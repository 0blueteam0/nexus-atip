---
type: scope
task_id: KW-20260703-131610-Red-Team-Studio-RedTeam-AX-real-operating-evidence-workflow-continuation
project: Red Team Studio
task: RedTeam AX real operating evidence workflow continuation
created: 2026-07-03T13:16:10+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the RedTeam AX goal by improving the real operating evidence readiness workflow. The current slice adds operator-readable remediation for missing required scanner outputs and records that this guidance does not execute scanners or satisfy final goal gates.

## Included

- Add `missing_tool_remediation` and `missing_tool_remediation_count` to the real operating evidence readiness model.
- Show missing tool, expected filename pattern, next human action, and safety status in the RedTeam2 frontend.
- Update Detailed_PLAN, FINAL_PLAN, LLM wiki, and completion audit artifacts.
- Add focused API and frontend sanity coverage.
- Verify that the overall goal remains blocked until real evidence, approvals, report validation, sample E2E, and regression gates pass.

## Excluded

- Running Nuclei, OpenVAS, Trivy, npm audit, SCA, or OWASP ZAP against real targets.
- Marking the `/goal` complete.
- Treating fixture or byproduct files as real operating evidence.
- Bypassing ROE/HITL/guardrail approvals.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| API model | Add remediation rows for missing required tool outputs | `projects/ai-agentic-soc/runtime/redteam_v2_models.py` |
| Frontend | Render remediation table in RedTeam2 | `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` |
| Tests | Validate OpenVAS/ZAP patterns and Korean copy anchors | `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`; `projects/ai-agentic-soc/Red Team Studio/고도화/sanity/*.py` |
| Documentation | Update plan, final plan, wiki, and completion audit matrix | `projects/ai-agentic-soc/Red Team Studio/Detailed_PLAN.MD`; `FINAL_PLAN.md`; `고도화/llm-wiki/LLM_WIKI_HOME.md`; `고도화/completion-audit/*` |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| source model | `projects/ai-agentic-soc/runtime/redteam_v2_models.py` | API contract implementation |
| frontend renderer | `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | RedTeam2 screen contract |
| targeted API tests | `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | Regression proof |
| sanity tests | `projects/ai-agentic-soc/Red Team Studio/고도화/sanity/` | Copy/runtime readiness proof |
| completion audit | `projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/` | Goal status evidence |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |
| Goal not complete | `goal_completion_blocked`, unresolved_item_count=1, remaining_gap_count=3 |

## Completion Definition

This slice is complete only when remediation guidance is implemented, tested, documented, committed, and pushed. The broader RedTeam AX `/goal` remains incomplete.
