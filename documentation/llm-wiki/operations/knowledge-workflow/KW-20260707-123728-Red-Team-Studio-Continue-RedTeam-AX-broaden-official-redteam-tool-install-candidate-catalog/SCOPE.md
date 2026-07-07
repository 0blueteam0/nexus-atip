---
type: scope
task_id: KW-20260707-123728-Red-Team-Studio-Continue-RedTeam-AX-broaden-official-redteam-tool-install-candidate-catalog
project: Red Team Studio
task: Continue RedTeam AX broaden official redteam tool install candidate catalog
created: 2026-07-07T12:37:28+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue RedTeam AX priority 1 work by broadening official-source redteam tool discovery and install/onboarding candidates beyond the initial scanner set.

## Included

- Inspect SPEC 24 tool categories.
- Add official-source install/onboarding candidates.
- Keep all new candidates non-executable until promotion gates exist.
- Strengthen backend readiness regression.
- Update Detailed_PLAN.MD and FINAL_PLAN.md.

## Excluded

- Running installers.
- Executing offensive, endpoint, cloud, or model-evaluation tools.
- Claiming the full RedTeam AX goal is complete.
- Claiming installation coverage for the new candidates.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| candidate_catalog | Add SPEC 24-aligned official-source candidates | redteam_v2_models.py |
| api_contract | Validate broadened candidate response | test_redteam_v2_api_router.py |
| plan_docs | Record scope and residual gaps | Detailed_PLAN.MD, FINAL_PLAN.md |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| model catalog | projects/ai-agentic-soc/runtime/redteam_v2_models.py | candidate registry |
| backend test | projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py | API contract |
| detailed plan | projects/ai-agentic-soc/Red Team Studio/Detailed_PLAN.MD | planning source |
| final plan | projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md | execution checklist |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
