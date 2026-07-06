---
type: scope
task_id: KW-20260706-122434-Red-Team-Studio-Continue-RedTeam-AX-goal-browser-verify-and-simplify-RedTeam2-analyst-workflow
project: Red-Team-Studio
task: Continue RedTeam AX goal: browser-verify and simplify RedTeam2 analyst workflow
created: 2026-07-06T12:24:34+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the RedTeam AX goal by browser-verifying and simplifying the RedTeam2 analyst workflow so administrator/runtime/path/closure details do not appear in the default analyst view.

## Included

- Inspect the live Report Studio RedTeam2 page at `http://127.0.0.1:5177`.
- Update RedTeam2 frontend rendering so admin details are collapsed behind `관리자 설정`.
- Update project plans, LLM Wiki, and completion audit records.
- Run syntax, sanity, JSON, completion audit, and browser DOM verification.
- Preserve knowledge workflow and handoff evidence.

## Excluded

- Do not mark the entire RedTeam AX goal complete.
- Do not run active scanners or high-risk red-team tools.
- Do not revert unrelated dirty worktree changes.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| frontend | Collapse admin details in RedTeam2 default analyst view | `reports.js` |
| browser | Verify default DOM forbidden terms and required analyst phrases | `browser/redteam2-browser-verify-20260706.json` |
| docs | Update FINAL/Detailed/LLM Wiki/completion audit matrix | project markdown/json docs |
| quality | Run sanity and close knowledge workflow | `QUALITY_GATE_RESULT.json` |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| RedTeam2 source | `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | frontend behavior |
| Browser verification | `browser/redteam2-browser-verify-20260706.json` | default DOM evidence |
| Completion audit | `projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | RTA-COMP-075 tracking |
| Knowledge gate | `QUALITY_GATE_RESULT.json` | workflow close result |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
