---
type: scope
task_id: KW-20260703-005045-Red-Team-Studio-RedTeam-AX-operating-scanner-artifact-submission-continuation-slice
project: Red Team Studio
task: RedTeam AX operating scanner artifact submission continuation slice
created: 2026-07-03T00:50:45+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the RedTeam AX platform work by closing the next operating scanner artifact submission gap while preserving ROE/HITL/guardrail and Evidence/Claim tracking.

## Included

- Backend API for toolchain artifact manifest import.
- RedTeam2 Korean UI for manifest submission.
- Regression tests and sanity gates for API, frontend copy, plan, wiki, and completion audit.
- Knowledge workflow and handoff records.

## Excluded

- Active scanner execution, Docker daemon start, WSL start, OpenVAS endpoint probe, and ZAP daemon probe.
- Claiming the whole RedTeam AX goal complete before real operating artifacts pass Evidence/Finding/Matrix/Report/export/completion gates.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| API | Add governed scanner artifact manifest import | `runtime/redteam_v2_models.py`, router endpoint |
| UI | Add Korean manifest import controls | `reports.js` |
| Tests | Cover six-tool manifest import and bad hash | `tests/test_redteam_v2_api_router.py` |
| Docs | Update plan, wiki, audit matrix | `Detailed_PLAN.MD`, `FINAL_PLAN.md`, `LLM_WIKI_HOME.md`, completion audit |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| Accepted gate manifest | `archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | Aggregate acceptance proof |
| Completion audit | `Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | Requirement tracking |
| Knowledge workflow | this session directory | Work evidence and handoff |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
