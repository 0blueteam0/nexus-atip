---
type: scope
task_id: KW-20260703-113625-Red-Team-Studio-RedTeam-AX-real-tool-operating-evidence-continuation
project: Red Team Studio
task: RedTeam AX real tool operating evidence continuation
created: 2026-07-03T11:36:25+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the persistent RedTeam AX goal by reducing the remaining real runtime evidence gap. The concrete slice is to re-check the current Docker/WSL runtime state, fix any runner defect that prevents a real governed container smoke, and preserve the result without claiming the overall goal complete.

## Included

- Inspect current RTA-COMP-015 completion audit status.
- Run Docker and WSL readiness probes.
- Fix the governed ephemeral container runner so approved argv is executed deterministically.
- Run real Docker container runtime smoke through RedTeam AX governance.
- Update completion audit, LLM Wiki, FINAL_PLAN.md, and Detailed_PLAN.MD.
- Run API, audit, byproduct, and accepted gate verification.

## Excluded

- Do not execute active network scans.
- Do not configure organization OpenVAS/ZAP endpoints or vault secrets.
- Do not mark the thread goal complete while WSL, external scanner endpoint, and real six-tool operating closure evidence remain unresolved.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| runtime_probe | Docker/WSL readiness probes | latest_container_runtime_smoke.json, latest_wsl_runtime_readiness.json |
| runner_fix | Clear container image ENTRYPOINT and execute only approved runner argv | runtime/redteam_v2_models.py, API regression |
| audit_update | Preserve Docker pass and remaining blockers | completion audit matrix and plans |
| verification | Re-run gates and completion review | accepted gate manifest, goal completion review artifact |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| Container smoke | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-runtime-smoke/latest_container_runtime_smoke.json` | Real Docker governed runtime evidence |
| Strict promotion | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-strict-live-readiness-promotion/latest_strict_live_readiness_promotion.json` | Shows Docker passed and WSL/external scanner gates remain blocked |
| Completion audit | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | Keeps goal active while remaining gaps exist |
| Accepted gates | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | Regression/gate proof |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
