---
type: scope
task_id: KW-20260701-122318-Red-Team-Studio-Implement-RedTeam-AX-v2-Report-Studio-redteam2-UI-and-API-sanity-slice
project: Red Team Studio
task: Implement RedTeam AX v2 Report Studio redteam2 UI and API sanity slice
created: 2026-07-01T12:23:18+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Implement concrete progress toward the updated RedTeam AX objective using `Red Team Studio/SPEC` and `Red Team Studio/Agentic RAG SPEC`: add a `레드팀 분석2` Report Studio workbench, introduce safe v2 backend contracts, keep ROE/HITL/guardrail and Evidence/Claim-Evidence gates central, and verify a focused slice.

## Included

- Frontend `redteam2` tab and isolated v2 UI state in Report Studio.
- Backend `/api/redteam/v2` router for health, ROE evaluation, ToolActionCard plan, manual run record, EvidenceCard creation, report validation, and report draft generation.
- FastAPI app router include.
- Focused unittest coverage for v2 API gate behavior and existing v1 redteam API regression.
- Update `FINAL_PLAN.md` to reflect slice 1 implementation status.

## Excluded

- Full live 5177/8765 browser smoke because local server lifecycle is not part of this slice.
- Full ToolHub, ScriptFactory, MCP v2 invoke, audit query, sample case E2E, and final release gate regression.
- Any actual high-risk tool execution.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| UI-S1 | Add `레드팀 분석2` tab and v2 panel | `src/store/methods/reports.js` |
| API-S1 | Add `/api/redteam/v2` safe-by-default contracts | `runtime/redteam_v2_api_router.py`, `runtime/redteam_v2_models.py` |
| TEST-S1 | Add and run focused API tests plus frontend build | `tests/test_redteam_v2_api_router.py`, command output |
| DOC-S1 | Update active plan state | `Red Team Studio/FINAL_PLAN.md` |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| v2 UI | `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | Report Studio `레드팀 분석2` |
| v2 API router | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py` | `/api/redteam/v2` contract |
| v2 models | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py` | ROE/ToolAction/Evidence/Report gate logic |
| FastAPI include | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/malware_upload_api.py` | router registration |
| v2 tests | `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | sanity and guardrail tests |
| active plan | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md` | current plan status |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Frontend compiles | `npm.cmd run build` exit_code 0 |
| v2 API tests pass | `.venv/Scripts/python.exe tests/test_redteam_v2_api_router.py` exit_code 0 |
| v1 redteam regression passes | `.venv/Scripts/python.exe tests/test_redteam_api_router.py` exit_code 0 |
| Plan sanity passes | `python 고도화/sanity/test_plan_contract.py` exit_code 0 |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

This slice is complete when the focused UI/API/test/doc changes are implemented, verified, evidence is recorded, and the knowledge workflow gate closes. The broader thread goal remains active until full sample E2E, security gate, report validation, regression, and GitHub push requirements are satisfied.
