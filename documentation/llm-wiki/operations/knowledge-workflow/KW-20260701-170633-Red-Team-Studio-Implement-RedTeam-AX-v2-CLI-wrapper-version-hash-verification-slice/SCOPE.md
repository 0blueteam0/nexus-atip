---
type: scope
task_id: KW-20260701-170633-Red-Team-Studio-Implement-RedTeam-AX-v2-CLI-wrapper-version-hash-verification-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 CLI wrapper version hash verification slice
created: 2026-07-01T17:06:33+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the active RedTeam AX v2 implementation goal by adding CLI/API wrapper manifest and hash preflight support for approved analysis tools. The slice must preserve safe-by-default behavior: registry reads may inspect command presence and file hash, but must not execute scanner/version commands.

## Included

- Backend model functions for tool wrapper manifest generation.
- API endpoints to list all wrapper manifests and inspect one tool.
- Integration with `analysis-tools` and `ToolExecutionPlan` responses.
- RedTeam2 Report Studio UI display for wrapper pinning and version probe status.
- API, sample E2E, frontend build, and plan sanity verification.
- FINAL_PLAN update for slice 25 scope and remaining gaps.

## Excluded

- No real scanner execution.
- No version command execution from registry read APIs.
- No expected SHA-256 pin write/approval workflow.
- No ephemeral container runner implementation.
- No live browser smoke against already-running 5177/8765 servers in this slice.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| backend-manifest | Add wrapper manifest/hash preflight functions and endpoints | `runtime/redteam_v2_models.py`, `runtime/redteam_v2_api_router.py` |
| execution-plan | Attach wrapper manifest/preflight warnings to ToolExecutionPlan | `runtime/redteam_v2_models.py` |
| frontend-ui | Show wrapper manifest/version pinning in RedTeam2 panel | `soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` |
| tests | Add API regression coverage and run sanity suite | `tests/test_redteam_v2_api_router.py` |
| plan | Update FINAL_PLAN slice status | `Red Team Studio/FINAL_PLAN.md` |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| Backend models | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py` | Wrapper manifest, runtime status, execution plan integration |
| Backend router | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py` | New manifest endpoints |
| Frontend report studio | `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | RedTeam2 UI manifest display |
| API tests | `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | Regression assertions |
| Final plan | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md` | Slice 25 project plan status |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

This slice is complete when wrapper manifest endpoints and UI are implemented, tests/build/sanity pass, knowledge workflow closes, cross-LLM handoff is recorded, and the exact scoped files are committed and pushed.
