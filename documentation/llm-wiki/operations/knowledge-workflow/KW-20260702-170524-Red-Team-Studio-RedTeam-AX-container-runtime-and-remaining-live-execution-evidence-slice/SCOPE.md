---
type: scope
task_id: KW-20260702-170524-Red-Team-Studio-RedTeam-AX-container-runtime-and-remaining-live-execution-evidence-slice
project: Red Team Studio
task: RedTeam AX container runtime and remaining live execution evidence slice
created: 2026-07-02T17:05:24+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the RedTeam AX implementation by reducing the remaining runtime evidence gap without overstating completion. The slice adds a WSL runtime readiness lane beside the existing Docker/OpenVAS/ZAP readiness artifacts.

## Included

- Probe current Docker/Podman/WSL runtime readiness using non-destructive commands.
- Add `redteam_ax_wsl_runtime_readiness.py` as a safe WSL readiness artifact generator.
- Project WSL readiness through `/api/redteam/v2/runtime-readiness`.
- Display WSL blocker status in Report Studio RedTeam2 runtime readiness UI.
- Update sanity tests, accepted gate manifest, plan documents, LLM wiki, and completion audit matrix.

## Excluded

- No active scanning.
- No high-risk execution.
- No Docker image/container execution unless the existing explicit real-run gate is used later.
- No WSL repair, distro recreation, credential recovery, or organization OpenVAS/ZAP endpoint provisioning in this slice.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| WSL readiness checker | Create safe WSL list/start-path probe | `Red Team Studio/고도화/sanity/redteam_ax_wsl_runtime_readiness.py` |
| API/UI projection | Surface WSL artifact in runtime readiness API and RedTeam2 panel | `runtime/redteam_v2_models.py`, `reports.js` |
| Regression gates | Add WSL gate and run accepted gate manifest | `latest_accepted_gate_manifest.json` |
| Documentation | Update plan/wiki/completion audit | `FINAL_PLAN.md`, `Detailed_PLAN.MD`, LLM wiki, completion audit |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| WSL readiness artifact | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-wsl-runtime-readiness/latest_wsl_runtime_readiness.json` | Current WSL distribution blocker evidence |
| Accepted gate manifest | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | 17/17 regression gate evidence |
| Runtime readiness API test | `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | Contract for `wsl_runtime` read-only projection |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The slice is complete when WSL readiness is implemented, surfaced, tested, documented, accepted gates pass, knowledge workflow closes, cross-LLM handoff is recorded, and the commit is pushed. The overall RedTeam AX goal remains active until Docker/container runtime, WSL ready state, and organization OpenVAS/ZAP live endpoint gates pass.
